"""推理逻辑 — 将前端参数映射到 IndexTTS 引擎调用"""

from __future__ import annotations

import asyncio
import time
import uuid
from pathlib import Path
from typing import AsyncGenerator

from .engine_manager import EngineManager
from .models import SynthesizeRequest, ProgressEvent, CompleteEvent, ErrorEvent

# 项目根目录
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
# 输出目录：音频、视频、字幕、参考音频、情感音频、预置样音
_OUTPUT_DIR = _PROJECT_ROOT / "output"
_OUTPUT_AUDIO_DIR = _OUTPUT_DIR / "audio"
_OUTPUT_VIDEO_DIR = _OUTPUT_DIR / "video"
_OUTPUT_SUBTITLE_DIR = _OUTPUT_DIR / "subtitle"
_OUTPUT_REF_AUDIO_DIR = _OUTPUT_DIR / "ref_audio"
_OUTPUT_EMO_AUDIO_DIR = _OUTPUT_DIR / "emo_audio"
_OUTPUT_PRESET_DIR = _OUTPUT_DIR / "preset"


def _ensure_output_dir() -> Path:
    """确保所有输出子目录存在"""
    for d in (_OUTPUT_DIR, _OUTPUT_AUDIO_DIR, _OUTPUT_VIDEO_DIR, _OUTPUT_SUBTITLE_DIR,
              _OUTPUT_REF_AUDIO_DIR, _OUTPUT_EMO_AUDIO_DIR, _OUTPUT_PRESET_DIR):
        d.mkdir(parents=True, exist_ok=True)
    return _OUTPUT_DIR


async def synthesize_stream(
    mgr: EngineManager,
    req: SynthesizeRequest,
) -> AsyncGenerator[str, None]:
    """SSE 流式推理 — 逐步推送进度事件，最终推送完成/错误事件"""

    engine = mgr.get_engine(req.engine)
    if engine is None:
        evt = ErrorEvent(message=f"引擎 {req.engine} 不可用或尚未加载").model_dump_json()
        yield f"data: {evt}\n\n"
        return

    _ensure_output_dir()
    output_path = str(_OUTPUT_AUDIO_DIR / f"{uuid.uuid4().hex}.wav")

    yield f"data: {ProgressEvent(progress=0.05, message='正在预处理文本…').model_dump_json()}\n\n"
    await asyncio.sleep(0)  # 让出事件循环

    try:
        if req.engine == "lightweight":
            result = await _run_v15(engine, req, output_path)
        else:
            result = await _run_v20(engine, req, output_path)

        if result is None:
            yield f"data: {ErrorEvent(message='推理失败，未生成音频').model_dump_json()}\n\n"
            return

        yield f"data: {CompleteEvent(output_path=result).model_dump_json()}\n\n"

    except Exception as e:
        yield f"data: {ErrorEvent(message=str(e)).model_dump_json()}\n\n"


async def synthesize_sync(
    mgr: EngineManager,
    req: SynthesizeRequest,
) -> str:
    """同步推理 — 返回输出路径，或抛出异常"""

    engine = mgr.get_engine(req.engine)
    if engine is None:
        raise RuntimeError(f"引擎 {req.engine} 不可用或尚未加载")

    _ensure_output_dir()
    output_path = str(_OUTPUT_AUDIO_DIR / f"{uuid.uuid4().hex}.wav")

    if req.engine == "lightweight":
        result = await _run_v15(engine, req, output_path)
    else:
        result = await _run_v20(engine, req, output_path)

    if result is None:
        raise RuntimeError("推理失败，未生成音频")
    return result


async def _run_v15(engine, req: SynthesizeRequest, output_path: str) -> str | None:
    """调用 IndexTTS v1.5 推理"""

    # 在线程池中运行阻塞的推理
    loop = asyncio.get_event_loop()

    if req.inference_mode == "batch":
        result = await loop.run_in_executor(
            None,
            _v15_infer_fast,
            engine, req, output_path,
        )
    else:
        result = await loop.run_in_executor(
            None,
            _v15_infer,
            engine, req, output_path,
        )
    return result


def _v15_infer_fast(engine, req: SynthesizeRequest, output_path: str) -> str | None:
    """v1.5 批量推理"""
    return engine.infer_fast(
        audio_prompt=req.speaker_audio_path,
        text=req.text,
        output_path=output_path,
        max_text_tokens_per_sentence=req.max_text_tokens_per_segment,
        sentences_bucket_max_size=req.bucket_max_size,
        do_sample=True,
        top_p=req.top_p,
        top_k=req.top_k,
        temperature=req.temperature,
        num_beams=req.num_beams,
        repetition_penalty=req.repetition_penalty,
        max_mel_tokens=req.max_mel_tokens,
    )


def _v15_infer(engine, req: SynthesizeRequest, output_path: str) -> str | None:
    """v1.5 普通推理"""
    return engine.infer(
        audio_prompt=req.speaker_audio_path,
        text=req.text,
        output_path=output_path,
        max_text_tokens_per_sentence=req.max_text_tokens_per_segment,
        do_sample=True,
        top_p=req.top_p,
        top_k=req.top_k,
        temperature=req.temperature,
        num_beams=req.num_beams,
        repetition_penalty=req.repetition_penalty,
        max_mel_tokens=req.max_mel_tokens,
    )


async def _run_v20(engine, req: SynthesizeRequest, output_path: str) -> str | None:
    """调用 IndexTTS v2.0 推理"""

    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        _v20_infer,
        engine, req, output_path,
    )
    return result


def _v20_infer(engine, req: SynthesizeRequest, output_path: str) -> str | None:
    """v2.0 推理 — 根据情感控制方式传递不同参数"""

    # 情感向量处理
    emo_vector = None
    emo_audio_prompt = None
    use_emo_text = False
    emo_text = None

    if req.emotion_method == "slider" and req.emotion_vector is not None:
        emo_vector = req.emotion_vector
    elif req.emotion_method == "text":
        use_emo_text = True
        emo_text = req.emotion_text or req.text
    elif req.emotion_method == "audio" and req.emotion_audio_path:
        emo_audio_prompt = req.emotion_audio_path

    return engine.infer(
        spk_audio_prompt=req.speaker_audio_path,
        text=req.text,
        output_path=output_path,
        emo_audio_prompt=emo_audio_prompt,
        emo_alpha=req.emo_alpha,
        emo_vector=emo_vector,
        use_emo_text=use_emo_text,
        emo_text=emo_text,
        interval_silence=req.interval_silence,
        max_text_tokens_per_segment=req.max_text_tokens_per_segment,
        do_sample=True,
        top_p=req.top_p,
        top_k=req.top_k,
        temperature=req.temperature,
        num_beams=req.num_beams,
        repetition_penalty=req.repetition_penalty,
        max_mel_tokens=req.max_mel_tokens,
    )
