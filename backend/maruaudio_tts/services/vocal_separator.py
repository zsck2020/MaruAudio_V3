"""人声分离服务

设计参考: V2 (18884e6) backend/services/vocal_separator.py
重写要点:
- 去掉 Qt 信号依赖，纯回调
- asyncio + loop.run_in_executor 包装阻塞推理
- demucs 优先 -> librosa 降级 -> 失败抛错
- 临时文件统一存放 output/vocal_temp/
"""

from __future__ import annotations

import asyncio
import os
import shutil
import subprocess
import time
from pathlib import Path
from typing import Awaitable, Callable, Optional, Tuple

ProgressCallback = Callable[[float, str], Awaitable[None]]
"""异步进度回调: callback(progress 0-1, message)"""

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_OUTPUT_DIR = _PROJECT_ROOT / "output"
_VOCAL_TEMP_DIR = _OUTPUT_DIR / "vocal_temp"
_TOOLS_DIR = _PROJECT_ROOT / "tools" / "ffmpeg"

VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm", ".m4v"}

_CUT_DURATION_SECONDS = 15
"""参考音频统一裁剪到 15 秒，足够 IndexTTS 提取声纹"""


def _resolve_ffmpeg() -> Tuple[str, str]:
    """优先使用项目自带 ffmpeg，回退系统 PATH"""
    bundled_ffmpeg = _TOOLS_DIR / "ffmpeg.exe"
    bundled_ffprobe = _TOOLS_DIR / "ffprobe.exe"
    ffmpeg = str(bundled_ffmpeg) if bundled_ffmpeg.exists() else "ffmpeg"
    ffprobe = str(bundled_ffprobe) if bundled_ffprobe.exists() else "ffprobe"
    return ffmpeg, ffprobe


class VocalSeparatorService:
    """人声分离服务 — 视频/音频 → 提取 → 裁剪 → 人声分离 → 输出"""

    def __init__(self) -> None:
        self.ffmpeg, self.ffprobe = _resolve_ffmpeg()
        self._librosa = None
        self._sf = None
        self._np = None
        self._torch = None
        self._demucs_pretrained = None
        self._demucs_apply = None
        self._method: str = "none"
        self._detect_dependencies()

        _VOCAL_TEMP_DIR.mkdir(parents=True, exist_ok=True)

    @property
    def method(self) -> str:
        """当前分离算法: 'demucs' | 'librosa' | 'none'"""
        return self._method

    def _detect_dependencies(self) -> None:
        """检测可用算法（不在此处加载模型，避免冷启动卡死）"""
        try:
            import librosa
            import soundfile as sf
            import numpy as np
            self._librosa = librosa
            self._sf = sf
            self._np = np
            self._method = "librosa"
        except ImportError:
            return

        try:
            import torch
            from demucs import pretrained
            from demucs.apply import apply_model
            self._torch = torch
            self._demucs_pretrained = pretrained
            self._demucs_apply = apply_model
            self._method = "demucs"
        except (ImportError, OSError):
            pass

    @staticmethod
    def is_video(file_path: str) -> bool:
        return Path(file_path).suffix.lower() in VIDEO_EXTENSIONS

    async def process(
        self,
        input_path: str,
        output_path: str,
        progress: Optional[ProgressCallback] = None,
    ) -> str:
        """异步处理: 视频/音频 → 人声分离 → 写入 output_path

        Args:
            input_path: 输入文件路径（视频或音频）
            output_path: 输出 WAV 路径
            progress: 异步进度回调

        Returns:
            实际输出路径（与 output_path 一致）

        Raises:
            FileNotFoundError: 输入文件不存在
            RuntimeError: ffmpeg 缺失 / demucs+librosa 均不可用 / 处理失败
        """
        if not Path(input_path).exists():
            raise FileNotFoundError(f"输入文件不存在: {input_path}")
        if self._method == "none":
            raise RuntimeError("缺少人声分离依赖：未安装 demucs 与 librosa")

        loop = asyncio.get_event_loop()
        temp_files: list[str] = []

        async def emit(p: float, msg: str) -> None:
            if progress is not None:
                await progress(p, msg)

        try:
            current_path = input_path

            if self.is_video(input_path):
                await emit(0.1, "正在从视频提取音频…")
                audio_path = await loop.run_in_executor(
                    None, self._extract_audio_blocking, input_path
                )
                if audio_path is None:
                    raise RuntimeError("视频音频提取失败")
                temp_files.append(audio_path)
                current_path = audio_path
                await emit(0.3, "音频提取完成")

            await emit(0.4, f"正在裁剪音频到 {_CUT_DURATION_SECONDS} 秒…")
            cut_path = await loop.run_in_executor(
                None, self._cut_audio_blocking, current_path
            )
            if cut_path is None:
                raise RuntimeError("音频裁剪失败")
            temp_files.append(cut_path)
            await emit(0.5, "裁剪完成")

            await emit(0.6, f"正在使用 {self._method} 分离人声…")
            vocal_path = await loop.run_in_executor(
                None, self._separate_blocking, cut_path
            )
            if vocal_path is None:
                raise RuntimeError("人声分离失败")
            temp_files.append(vocal_path)
            await emit(0.9, "人声分离完成")

            Path(output_path).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(vocal_path, output_path)
            os.utime(output_path, None)
            await emit(1.0, "处理完成")
            return output_path

        finally:
            for f in temp_files:
                if f != output_path and Path(f).exists():
                    try:
                        os.remove(f)
                    except OSError:
                        pass

    def _extract_audio_blocking(self, video_path: str) -> Optional[str]:
        """ffmpeg 提取音频为 16-bit 单声道 WAV"""
        timestamp = int(time.time() * 1000)
        audio_path = str(_VOCAL_TEMP_DIR / f"extract_{timestamp}.wav")
        cmd = [
            self.ffmpeg, "-i", video_path,
            "-vn", "-acodec", "pcm_s16le",
            "-ar", "44100", "-ac", "1",
            "-y", audio_path,
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        if result.returncode != 0 or not Path(audio_path).exists():
            return None
        return audio_path

    def _cut_audio_blocking(self, audio_path: str) -> Optional[str]:
        """裁剪到 15 秒（librosa 优先，回退 ffmpeg）"""
        timestamp = int(time.time() * 1000)
        cut_path = str(_VOCAL_TEMP_DIR / f"cut_{timestamp}.wav")

        if self._librosa is not None:
            try:
                y, sr = self._librosa.load(audio_path, sr=None)
                duration_samples = min(_CUT_DURATION_SECONDS * sr, len(y))
                self._sf.write(cut_path, y[:duration_samples], sr, subtype="PCM_16")
                return cut_path
            except Exception:
                pass

        cmd = [
            self.ffmpeg, "-i", audio_path,
            "-t", str(_CUT_DURATION_SECONDS),
            "-y", cut_path,
        ]
        result = subprocess.run(
            cmd,
            capture_output=True,
            creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
        )
        return cut_path if result.returncode == 0 else None

    def _separate_blocking(self, audio_path: str) -> Optional[str]:
        if self._method == "demucs":
            try:
                return self._separate_demucs(audio_path)
            except Exception:
                return self._separate_librosa(audio_path)
        if self._method == "librosa":
            return self._separate_librosa(audio_path)
        return None

    def _separate_demucs(self, audio_path: str) -> Optional[str]:
        """Demucs (htdemucs_ft) 分离人声"""
        device = "cuda" if self._torch.cuda.is_available() else "cpu"

        model = self._demucs_pretrained.get_model("htdemucs_ft")
        model.to(device)
        model.eval()

        wav, sr = self._librosa.load(audio_path, sr=44100, mono=False)
        if wav.ndim == 1:
            wav = self._np.stack([wav, wav])

        wav_tensor = self._torch.from_numpy(wav).float().unsqueeze(0).to(device)
        with self._torch.no_grad():
            sources = self._demucs_apply(model, wav_tensor, device=device)

        # 第 4 个 stem 是 vocals（drums / bass / other / vocals）
        vocals = sources[0, 3].cpu().numpy()
        if vocals.ndim > 1:
            vocals = self._np.mean(vocals, axis=0)

        timestamp = int(time.time() * 1000)
        vocal_path = str(_VOCAL_TEMP_DIR / f"vocal_demucs_{timestamp}.wav")
        self._sf.write(vocal_path, vocals, sr, subtype="PCM_16")
        return vocal_path

    def _separate_librosa(self, audio_path: str) -> Optional[str]:
        """Librosa HPSS 谐波-冲击源分离（降级方案）"""
        if self._librosa is None:
            return None
        y, sr = self._librosa.load(audio_path, sr=None)
        S_full = self._librosa.stft(y)
        S_harmonic, _ = self._librosa.decompose.hpss(self._np.abs(S_full))
        phase = self._np.angle(S_full)
        vocals = self._librosa.istft(S_harmonic * self._np.exp(1j * phase), length=len(y))

        timestamp = int(time.time() * 1000)
        vocal_path = str(_VOCAL_TEMP_DIR / f"vocal_librosa_{timestamp}.wav")
        self._sf.write(vocal_path, vocals, sr, subtype="PCM_16")
        return vocal_path


_singleton: Optional[VocalSeparatorService] = None


def get_vocal_separator() -> VocalSeparatorService:
    """全局单例（避免重复加载 demucs / librosa）"""
    global _singleton
    if _singleton is None:
        _singleton = VocalSeparatorService()
    return _singleton
