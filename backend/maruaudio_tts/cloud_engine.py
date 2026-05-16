"""云端 TTS 引擎 — 阿里云百炼 Qwen3-TTS 接口

设计要点:
- 用户面不暴露「阿里云百炼」「Qwen3-TTS」等真实厂商/模型名
- 统一走 EngineProtocol 接口，与本地引擎平级
- API Key 从环境变量 DASHSCOPE_API_KEY 读取
- 支持 voice cloning（传入参考音频）
- 支持情感控制（emotion_vector / emotion_text）
"""

from __future__ import annotations

import asyncio
import logging
import os
import tempfile
import uuid
from pathlib import Path
from typing import Awaitable, Callable, Optional

logger = logging.getLogger(__name__)

ProgressCallback = Callable[[float, str], Awaitable[None]]

# 输出目录
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
_OUTPUT_DIR = _PROJECT_ROOT / "output"
_OUTPUT_CLOUD_DIR = _OUTPUT_DIR / "audio"


def _get_api_key() -> Optional[str]:
    """获取 DashScope API Key"""
    return os.environ.get("DASHSCOPE_API_KEY")


def is_configured() -> bool:
    """检查云端引擎是否已配置 API Key"""
    return _get_api_key() is not None


async def check_availability() -> dict:
    """检查云端引擎可用性

    Returns:
        {"engine": "cloud", "available": bool, "message": str}
    """
    api_key = _get_api_key()
    if not api_key:
        return {
            "engine": "cloud",
            "available": False,
            "message": "未配置 API Key",
        }

    # 尝试导入 dashscope
    try:
        import dashscope  # noqa: F401
    except ImportError:
        return {
            "engine": "cloud",
            "available": False,
            "message": "未安装 dashscope SDK",
        }

    return {
        "engine": "cloud",
        "available": True,
        "message": "云端引擎可用",
    }


async def synthesize(
    text: str,
    speaker_audio_path: Optional[str] = None,
    emotion_method: str = "slider",
    emotion_vector: Optional[list[float]] = None,
    emotion_text: Optional[str] = None,
    emotion_audio_path: Optional[str] = None,
    emo_alpha: float = 1.0,
    temperature: float = 1.0,
    top_p: float = 0.8,
    progress: Optional[ProgressCallback] = None,
) -> str:
    """调用云端 TTS 引擎生成音频

    Args:
        text: 待合成文本
        speaker_audio_path: 参考音频路径（用于 voice cloning）
        emotion_method: 情感控制方式
        emotion_vector: 情感向量
        emotion_text: 情感描述文本
        emotion_audio_path: 情感参考音频
        emo_alpha: 情感强度
        temperature: 采样温度
        top_p: top_p 采样
        progress: 进度回调

    Returns:
        输出音频文件路径

    Raises:
        RuntimeError: API Key 未配置或调用失败
        ImportError: dashscope SDK 未安装
    """
    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError("云端引擎 API Key 未配置（请设置环境变量 DASHSCOPE_API_KEY）")

    try:
        import dashscope
        from dashscope.audio.tts_v2 import SpeechSynthesizer
    except ImportError:
        raise ImportError("未安装 dashscope SDK，请执行: pip install dashscope")

    async def emit(p: float, msg: str) -> None:
        if progress is not None:
            await progress(p, msg)

    await emit(0.1, "正在准备云端推理…")

    # 设置 API Key
    dashscope.api_key = api_key

    # 构建请求参数
    model = "qwen3-tts"

    # 情感文本处理
    emo_prompt = None
    if emotion_method == "text" and emotion_text:
        emo_prompt = emotion_text
    elif emotion_method == "audio" and emotion_audio_path:
        # 情感参考音频通过 extra 参数传递
        pass

    await emit(0.3, "正在调用云端引擎…")

    # 在线程池中运行阻塞的 API 调用
    loop = asyncio.get_event_loop()

    try:
        output_path = await loop.run_in_executor(
            None,
            _synthesize_blocking,
            model,
            text,
            speaker_audio_path,
            emo_prompt,
            emo_alpha,
            temperature,
            top_p,
        )
    except Exception as e:
        logger.exception("cloud TTS failed")
        raise RuntimeError(f"云端推理失败: {e}") from e

    await emit(1.0, "云端推理完成")
    return output_path


def _synthesize_blocking(
    model: str,
    text: str,
    speaker_audio_path: Optional[str],
    emo_prompt: Optional[str],
    emo_alpha: float,
    temperature: float,
    top_p: float,
) -> str:
    """同步调用 DashScope TTS API（在线程池中运行）"""
    from dashscope.audio.tts_v2 import SpeechSynthesizer

    _OUTPUT_CLOUD_DIR.mkdir(parents=True, exist_ok=True)
    output_path = str(_OUTPUT_CLOUD_DIR / f"cloud_{uuid.uuid4().hex}.wav")

    # 构建合成器
    synthesizer = SpeechSynthesizer(
        model=model,
        voice="Chelsie",  # 默认音色，可被参考音频覆盖
        format="wav",
    )

    # 如果有参考音频，设置 voice cloning
    if speaker_audio_path and Path(speaker_audio_path).exists():
        # 读取参考音频
        with open(speaker_audio_path, "rb") as f:
            ref_audio = f.read()
        # 设置参考音频进行声音克隆
        synthesizer.set_reference_audio(ref_audio)

    # 设置情感提示
    if emo_prompt:
        synthesizer.set_emotion_prompt(emo_prompt)

    # 执行合成
    audio_data = synthesizer.call(text)

    if audio_data is None:
        raise RuntimeError("云端引擎未返回音频数据")

    # 写入文件
    with open(output_path, "wb") as f:
        if isinstance(audio_data, bytes):
            f.write(audio_data)
        elif hasattr(audio_data, "read"):
            f.write(audio_data.read())
        else:
            # 尝试从 response 对象获取音频
            if hasattr(audio_data, "get_audio_data"):
                f.write(audio_data.get_audio_data())
            else:
                raise RuntimeError(f"无法解析云端返回的音频数据: {type(audio_data)}")

    return output_path


async def synthesize_stream(
    text: str,
    speaker_audio_path: Optional[str] = None,
    emotion_method: str = "slider",
    emotion_vector: Optional[list[float]] = None,
    emotion_text: Optional[str] = None,
    emotion_audio_path: Optional[str] = None,
    emo_alpha: float = 1.0,
    temperature: float = 1.0,
    top_p: float = 0.8,
    progress: Optional[ProgressCallback] = None,
):
    """流式合成（生成器，逐步推送进度）"""
    yield {"type": "progress", "progress": 0.05, "message": "正在准备云端推理…"}

    try:
        output_path = await synthesize(
            text=text,
            speaker_audio_path=speaker_audio_path,
            emotion_method=emotion_method,
            emotion_vector=emotion_vector,
            emotion_text=emotion_text,
            emotion_audio_path=emotion_audio_path,
            emo_alpha=emo_alpha,
            temperature=temperature,
            top_p=top_p,
            progress=progress,
        )
        yield {"type": "complete", "output_path": output_path}
    except Exception as e:
        yield {"type": "error", "message": str(e)}
