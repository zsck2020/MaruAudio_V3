"""FastAPI 应用 — MaruAudio TTS Server"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from .engine_manager import EngineManager
from .inference import synthesize_sync, synthesize_stream, _OUTPUT_DIR, _OUTPUT_AUDIO_DIR, _OUTPUT_VIDEO_DIR, _OUTPUT_SUBTITLE_DIR, _OUTPUT_REF_AUDIO_DIR, _OUTPUT_EMO_AUDIO_DIR, _OUTPUT_PRESET_DIR
from . import cloud_engine
from .models import (
    SynthesizeRequest,
    HealthResponse,
    EngineStatus,
    VocalSeparateRequest,
    VocalSeparateCompleteEvent,
    TranscribeRequest,
    TranscribeCompleteEvent,
    ProgressEvent,
    ErrorEvent,
)
from .services.subtitle import (
    ASRModelEnum,
    TranscribeConfig,
    transcribe_audio,
    transcribe_video,
)
from .services.subtitle.transcribe import AUDIO_EXTENSIONS, VIDEO_EXTENSIONS
from .services.vocal_separator import get_vocal_separator

logger = logging.getLogger(__name__)

# 默认端口
DEFAULT_PORT = int(os.environ.get("MARUAUDIO_TTS_PORT", "9880"))

# 全局引擎管理器
_mgr = EngineManager()


def create_app() -> FastAPI:
    app = FastAPI(title="MaruAudio TTS Server", version="0.1.0")

    # CORS — 仅允许本地访问（桌面端 Tauri + 开发期 Web）
    # 覆盖的 origin：
    #   tauri://localhost                       (Tauri WebView)
    #   tauri://tauri.localhost                 (Tauri 2 自定义协议)
    #   https://tauri.localhost                 (Tauri Windows IPC)
    #   http://localhost:<port>                 (Vite dev)
    #   http://127.0.0.1:<port>                 (Vite dev IP 访问)
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=(
            r"^(?:"
            r"tauri://(?:localhost|tauri\.localhost)"
            r"|https?://(?:localhost|127\.0\.0\.1|tauri\.localhost)(?::\d+)?"
            r")$"
        ),
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", response_model=HealthResponse)
    async def health():
        """健康检查 — 返回所有引擎状态"""
        statuses = _mgr.status()
        return HealthResponse(
            status="ok",
            engines=[EngineStatus(**s) for s in statuses],
        )

    @app.post("/synthesize")
    async def synthesize(req: SynthesizeRequest):
        """同步推理 — 返回输出路径"""
        try:
            if req.engine == "cloud":
                output_path = await cloud_engine.synthesize(
                    text=req.text,
                    speaker_audio_path=req.speaker_audio_path,
                    emotion_method=req.emotion_method,
                    emotion_vector=req.emotion_vector,
                    emotion_text=req.emotion_text,
                    emotion_audio_path=req.emotion_audio_path,
                    emo_alpha=req.emo_alpha,
                    temperature=req.temperature,
                    top_p=req.top_p,
                )
            else:
                output_path = await synthesize_sync(_mgr, req)
            return {"output_path": output_path}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/synthesize/stream")
    async def synthesize_sse(req: SynthesizeRequest):
        """SSE 流式推理 — 推送进度事件"""
        if req.engine == "cloud":
            return EventSourceResponse(cloud_engine.synthesize_stream(
                text=req.text,
                speaker_audio_path=req.speaker_audio_path,
                emotion_method=req.emotion_method,
                emotion_vector=req.emotion_vector,
                emotion_text=req.emotion_text,
                emotion_audio_path=req.emotion_audio_path,
                emo_alpha=req.emo_alpha,
                temperature=req.temperature,
                top_p=req.top_p,
            ))
        return EventSourceResponse(synthesize_stream(_mgr, req))

    @app.post("/engine/{engine_name}/preload")
    async def preload_engine(engine_name: str):
        """预加载指定引擎"""
        if engine_name not in ("lightweight", "emotion", "cloud"):
            raise HTTPException(status_code=400, detail=f"未知引擎: {engine_name}")
        if engine_name == "cloud":
            # 云端引擎无需预加载，直接检查可用性
            status = _mgr.check_cloud()
            if not status["available"]:
                raise HTTPException(status_code=503, detail=status["message"])
            return {"status": "available", "engine": engine_name}
        inst = _mgr.get_engine(engine_name)
        if inst is None:
            raise HTTPException(status_code=500, detail=f"引擎 {engine_name} 加载失败")
        return {"status": "loaded", "engine": engine_name}

    @app.get("/output-dir")
    async def get_output_dir():
        """返回 output 目录路径"""
        return {
            "root": str(_OUTPUT_DIR),
            "audio": str(_OUTPUT_AUDIO_DIR),
            "video": str(_OUTPUT_VIDEO_DIR),
            "subtitle": str(_OUTPUT_SUBTITLE_DIR),
            "ref_audio": str(_OUTPUT_REF_AUDIO_DIR),
            "emo_audio": str(_OUTPUT_EMO_AUDIO_DIR),
            "preset": str(_OUTPUT_PRESET_DIR),
        }

    # ==================== 人声分离 ====================

    @app.post("/vocal-separate")
    async def vocal_separate(req: VocalSeparateRequest):
        """人声分离 — SSE 流式推送进度

        视频或音频文件 → 提取音频 → 裁剪 15s → 人声分离 → 输出 WAV
        """
        separator = get_vocal_separator()
        if separator.method == "none":
            raise HTTPException(
                status_code=503,
                detail="人声分离不可用：未安装 demucs / librosa",
            )

        if req.output_path:
            output_path = req.output_path
        else:
            _OUTPUT_REF_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
            output_path = str(_OUTPUT_REF_AUDIO_DIR / f"vocal_{uuid.uuid4().hex}.wav")

        async def event_stream():
            queue: asyncio.Queue = asyncio.Queue()

            async def progress(p: float, msg: str) -> None:
                evt = ProgressEvent(progress=p, message=msg)
                await queue.put(("data", evt.model_dump_json()))

            async def runner():
                try:
                    result = await separator.process(req.input_path, output_path, progress=progress)
                    evt = VocalSeparateCompleteEvent(
                        output_path=result,
                        method=separator.method,
                    )
                    await queue.put(("data", evt.model_dump_json()))
                except Exception as e:
                    logger.exception("vocal_separate failed")
                    evt = ErrorEvent(message=str(e))
                    await queue.put(("data", evt.model_dump_json()))
                finally:
                    await queue.put(("done", None))

            task = asyncio.create_task(runner())
            try:
                while True:
                    kind, payload = await queue.get()
                    if kind == "done":
                        break
                    yield f"data: {payload}\n\n"
            finally:
                if not task.done():
                    task.cancel()

        return EventSourceResponse(event_stream())

    @app.get("/vocal-separate/info")
    async def vocal_separate_info():
        """返回当前人声分离能力信息"""
        separator = get_vocal_separator()
        return {
            "available": separator.method != "none",
            "method": separator.method,
            "supports_video": True,
            "cut_duration_seconds": 15,
        }

    # ==================== 字幕生成（ASR） ====================

    @app.post("/transcribe")
    async def transcribe(req: TranscribeRequest):
        """字幕转录 — SSE 流式推送进度

        音频或视频文件 → ASR → 字幕（按 output_format 输出）
        """
        suffix = Path(req.input_path).suffix.lower()
        is_audio = suffix in AUDIO_EXTENSIONS
        is_video = suffix in VIDEO_EXTENSIONS
        if not (is_audio or is_video):
            raise HTTPException(
                status_code=400, detail=f"不支持的文件类型: {suffix}"
            )

        _OUTPUT_SUBTITLE_DIR.mkdir(parents=True, exist_ok=True)
        output_path = str(_OUTPUT_SUBTITLE_DIR / f"sub_{uuid.uuid4().hex}.{req.output_format}")

        try:
            asr_model = ASRModelEnum(req.asr_model)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"未知 ASR 引擎: {req.asr_model}")

        config = TranscribeConfig(
            asr_model=asr_model,
            language=req.language,
            need_word_timestamp=req.need_word_timestamp,
        )

        async def event_stream():
            queue: asyncio.Queue = asyncio.Queue()

            async def progress(p: float, msg: str) -> None:
                evt = ProgressEvent(progress=p, message=msg)
                await queue.put(("data", evt.model_dump_json()))

            async def runner():
                try:
                    if is_video:
                        asr_data = await transcribe_video(req.input_path, config, progress=progress)
                    else:
                        asr_data = await transcribe_audio(req.input_path, config, progress=progress)

                    # 优化时间戳后导出
                    asr_data.optimize_timing()
                    if req.output_format == "srt":
                        asr_data.save_srt(output_path)
                    elif req.output_format == "vtt":
                        asr_data.save_vtt(output_path)
                    elif req.output_format == "ass":
                        asr_data.save_ass(output_path)
                    elif req.output_format == "json":
                        Path(output_path).write_text(
                            json.dumps(asr_data.to_json(), ensure_ascii=False, indent=2),
                            encoding="utf-8",
                        )

                    duration_ms = (
                        asr_data.segments[-1].end_time if asr_data.segments else 0
                    )
                    evt = TranscribeCompleteEvent(
                        output_path=output_path,
                        segment_count=len(asr_data),
                        duration_ms=duration_ms,
                    )
                    await queue.put(("data", evt.model_dump_json()))
                except Exception as e:
                    logger.exception("transcribe failed")
                    evt = ErrorEvent(message=str(e))
                    await queue.put(("data", evt.model_dump_json()))
                finally:
                    await queue.put(("done", None))

            task = asyncio.create_task(runner())
            try:
                while True:
                    kind, payload = await queue.get()
                    if kind == "done":
                        break
                    yield f"data: {payload}\n\n"
            finally:
                if not task.done():
                    task.cancel()

        return EventSourceResponse(event_stream())

    return app


def main():
    """启动 TTS Server"""
    import uvicorn

    app = create_app()
    uvicorn.run(app, host="127.0.0.1", port=DEFAULT_PORT, log_level="info")


if __name__ == "__main__":
    main()
