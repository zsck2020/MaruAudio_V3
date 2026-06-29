"""推理逻辑 — 将前端参数映射到 IndexTTS 引擎调用"""

from __future__ import annotations

import asyncio
import logging
import time
import uuid
from pathlib import Path
from typing import AsyncGenerator

from .cache import TTSCache
from .engine_manager import EngineManager
from .models import SynthesizeRequest, ProgressEvent, CompleteEvent, ErrorEvent

logger = logging.getLogger(__name__)

_cache = TTSCache()

# 项目根目录与后端目录
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
_BACKEND_DIR = Path(__file__).resolve().parent.parent
# 运行时产物根目录：统一到 backend/output（与 cache.py 一致，受 .gitignore 的 output/ 规则忽略）
_OUTPUT_DIR = _BACKEND_DIR / "output"
_OUTPUT_AUDIO_DIR = _OUTPUT_DIR / "audio"
_OUTPUT_VIDEO_DIR = _OUTPUT_DIR / "video"
_OUTPUT_SUBTITLE_DIR = _OUTPUT_DIR / "subtitle"
_OUTPUT_REF_AUDIO_DIR = _OUTPUT_DIR / "ref_audio"
_OUTPUT_EMO_AUDIO_DIR = _OUTPUT_DIR / "emo_audio"
# 预置样音随仓库分发，单独位于 backend/outputs/preset（已纳入 git，非运行时产物）
_OUTPUT_PRESET_DIR = _BACKEND_DIR / "outputs" / "preset"


def _ensure_output_dir() -> Path:
    """确保所有运行时输出子目录存在（预置样音目录为只读资源，不在此创建）"""
    for d in (_OUTPUT_DIR, _OUTPUT_AUDIO_DIR, _OUTPUT_VIDEO_DIR, _OUTPUT_SUBTITLE_DIR,
              _OUTPUT_REF_AUDIO_DIR, _OUTPUT_EMO_AUDIO_DIR):
        d.mkdir(parents=True, exist_ok=True)
    return _OUTPUT_DIR


def _fingerprint_for(req: SynthesizeRequest) -> str:
    """构造缓存指纹 — 纳入全部影响输出的参数，避免错误命中。"""
    return _cache.compute_fingerprint(
        text=req.text,
        engine=req.engine,
        speaker_audio_path=req.speaker_audio_path,
        temperature=req.temperature,
        top_p=req.top_p,
        top_k=req.top_k,
        interval_silence=req.interval_silence,
        emotion_method=req.emotion_method,
        emotion_text=req.emotion_text,
        emotion_vector=req.emotion_vector,
        emo_alpha=req.emo_alpha,
        emotion_audio_path=req.emotion_audio_path,
        max_mel_tokens=req.max_mel_tokens,
        num_beams=req.num_beams,
        repetition_penalty=req.repetition_penalty,
        inference_mode=req.inference_mode,
        bucket_max_size=req.bucket_max_size,
        max_text_tokens_per_segment=req.max_text_tokens_per_segment,
    )


async def synthesize_stream(
    mgr: EngineManager,
    req: SynthesizeRequest,
) -> AsyncGenerator[str, None]:
    """SSE 流式推理 — 逐步推送进度事件，最终推送完成/错误事件"""

    fp = _fingerprint_for(req)

    cached_path = _cache.lookup(fp)
    if cached_path is not None:
        duration_s = 0.0
        try:
            import wave
            with wave.open(cached_path, 'rb') as wf:
                duration_s = wf.getnframes() / wf.getframerate()
        except Exception:
            pass
        yield f"data: {ProgressEvent(progress=1.0, message='缓存命中', segment_current=1, segment_total=1).model_dump_json()}\n\n"
        yield f"data: {CompleteEvent(output_path=cached_path, duration_seconds=round(duration_s, 2), rtf=0.0).model_dump_json()}\n\n"
        return

    engine = mgr.get_engine(req.engine)
    if engine is None:
        evt = ErrorEvent(message=f"引擎 {req.engine} 不可用或尚未加载").model_dump_json()
        yield f"data: {evt}\n\n"
        return

    _ensure_output_dir()
    output_path = str(_OUTPUT_AUDIO_DIR / f"{uuid.uuid4().hex}.wav")

    text_len = len(req.text)
    est_segments = max(1, text_len // (req.max_text_tokens_per_segment * 2))
    engine_label = "轻量引擎" if req.engine == "lightweight" else "情感引擎"

    yield f"data: {ProgressEvent(progress=0.05, message=f'正在预处理文本（约 {est_segments} 段）…', segment_total=est_segments).model_dump_json()}\n\n"
    await asyncio.sleep(0)

    yield f"data: {ProgressEvent(progress=0.1, message=f'{engine_label}推理中…', segment_current=0, segment_total=est_segments).model_dump_json()}\n\n"
    await asyncio.sleep(0)

    try:
        t0 = time.time()
        coro = _run_v15(engine, req, output_path) if req.engine == "lightweight" else _run_v20(engine, req, output_path)
        inference_task = asyncio.ensure_future(coro)

        est_seconds = max(5, est_segments * 4)
        progress_step = 0.78 / est_seconds
        current_progress = 0.1

        while not inference_task.done():
            await asyncio.sleep(1.5)
            if not inference_task.done():
                current_progress = min(0.88, current_progress + progress_step * 1.5)
                elapsed_s = time.time() - t0
                yield f"data: {ProgressEvent(progress=round(current_progress, 3), message=f'{engine_label}推理中… ({elapsed_s:.0f}s)', segment_current=min(int(current_progress * est_segments), est_segments - 1), segment_total=est_segments).model_dump_json()}\n\n"

        result = await inference_task
        elapsed = time.time() - t0

        if result is None:
            yield f"data: {ErrorEvent(message='推理失败，未生成音频').model_dump_json()}\n\n"
            return

        duration_s = 0.0
        try:
            import wave
            with wave.open(result, 'rb') as wf:
                duration_s = wf.getnframes() / wf.getframerate()
        except Exception:
            pass
        rtf = elapsed / duration_s if duration_s > 0 else 0.0

        _cache.store(fp, result, text_preview=req.text, engine=req.engine)

        yield f"data: {ProgressEvent(progress=0.95, message='合成完成，正在保存…', segment_current=est_segments, segment_total=est_segments).model_dump_json()}\n\n"
        await asyncio.sleep(0)

        yield f"data: {CompleteEvent(output_path=result, duration_seconds=round(duration_s, 2), rtf=round(rtf, 3)).model_dump_json()}\n\n"

    except Exception as e:
        logger.exception("synthesize_stream failed")
        yield f"data: {ErrorEvent(message=f'推理失败：{type(e).__name__}').model_dump_json()}\n\n"


async def synthesize_sync(
    mgr: EngineManager,
    req: SynthesizeRequest,
) -> str:
    """同步推理 — 返回输出路径，或抛出异常"""

    fp = _fingerprint_for(req)
    cached_path = _cache.lookup(fp)
    if cached_path is not None:
        return cached_path

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

    _cache.store(fp, result, text_preview=req.text, engine=req.engine)
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

    mel_tokens = req.max_mel_tokens if req.max_mel_tokens > 600 else 1500

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
        max_mel_tokens=mel_tokens,
    )
