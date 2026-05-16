"""字幕转录统一入口

设计参考: V2 (18884e6) backend/subtitle/transcribe.py
重写要点:
- 视频 → ffmpeg 抽取音频 → 调 ASR 引擎
- 当前仅 BIJIAN，预留 whisper/paraformer
"""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Awaitable, Callable, Optional

from .asr_data import ASRData
from .bcut_asr import BcutASR
from .entities import ASRModelEnum, TranscribeConfig

logger = logging.getLogger(__name__)

AUDIO_EXTENSIONS = {".mp3", ".wav", ".flac", ".m4a", ".aac", ".ogg"}
VIDEO_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv", ".webm", ".m4v"}

ProgressCallback = Callable[[float, str], Awaitable[None]]

_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
_FFMPEG = _PROJECT_ROOT / "tools" / "ffmpeg" / "ffmpeg.exe"


def _resolve_ffmpeg() -> str:
    return str(_FFMPEG) if _FFMPEG.exists() else "ffmpeg"


async def transcribe_audio(
    audio_path: str,
    config: TranscribeConfig,
    progress: Optional[ProgressCallback] = None,
) -> ASRData:
    """转录音频文件"""
    path = Path(audio_path)
    if not path.exists():
        raise FileNotFoundError(f"音频文件不存在: {audio_path}")

    if config.asr_model == ASRModelEnum.BIJIAN:
        asr = BcutASR(
            audio_path=str(path),
            need_word_timestamp=config.need_word_timestamp,
            timeout_seconds=config.timeout_seconds,
        )
        return await asr.transcribe(progress=progress)

    raise ValueError(
        f"不支持的 ASR 模型: {config.asr_model}（当前仅支持 BIJIAN）"
    )


async def transcribe_video(
    video_path: str,
    config: TranscribeConfig,
    progress: Optional[ProgressCallback] = None,
) -> ASRData:
    """转录视频文件（视频 → 提取音频 → 转录）"""
    path = Path(video_path)
    if not path.exists():
        raise FileNotFoundError(f"视频文件不存在: {video_path}")

    if path.suffix.lower() in AUDIO_EXTENSIONS:
        return await transcribe_audio(str(path), config, progress)

    async def emit(p: float, msg: str) -> None:
        if progress is not None:
            await progress(p, msg)

    await emit(0.0, "提取音频…")
    temp_dir = Path(tempfile.mkdtemp(prefix="maru_asr_"))
    temp_audio = temp_dir / "audio.wav"
    try:
        loop = asyncio.get_event_loop()
        ok = await loop.run_in_executor(
            None, _ffmpeg_extract_audio, str(path), str(temp_audio)
        )
        if not ok:
            raise RuntimeError("视频音频提取失败")
        await emit(0.05, "音频提取完成")
        return await transcribe_audio(str(temp_audio), config, progress)
    finally:
        try:
            shutil.rmtree(temp_dir, ignore_errors=True)
        except Exception:
            pass


def _ffmpeg_extract_audio(video_path: str, output_path: str) -> bool:
    """同步：ffmpeg 抽音频（16-bit / 44.1 kHz / 单声道）"""
    ffmpeg = _resolve_ffmpeg()
    cmd = [
        ffmpeg, "-i", video_path,
        "-vn", "-acodec", "pcm_s16le",
        "-ar", "44100", "-ac", "1",
        "-y", output_path,
    ]
    result = subprocess.run(
        cmd,
        capture_output=True,
        creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
    )
    return result.returncode == 0 and Path(output_path).exists()
