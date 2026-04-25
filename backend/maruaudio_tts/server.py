"""FastAPI 应用 — MaruAudio TTS Server"""

from __future__ import annotations

import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from .engine_manager import EngineManager
from .inference import synthesize_sync, synthesize_stream, _OUTPUT_DIR, _OUTPUT_AUDIO_DIR, _OUTPUT_VIDEO_DIR, _OUTPUT_SUBTITLE_DIR, _OUTPUT_REF_AUDIO_DIR, _OUTPUT_EMO_AUDIO_DIR, _OUTPUT_PRESET_DIR
from .models import SynthesizeRequest, HealthResponse, EngineStatus

# 默认端口
DEFAULT_PORT = int(os.environ.get("MARUAUDIO_TTS_PORT", "9880"))

# 全局引擎管理器
_mgr = EngineManager()


def create_app() -> FastAPI:
    app = FastAPI(title="MaruAudio TTS Server", version="0.1.0")

    # CORS — 仅允许本地访问
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["tauri://localhost", "https://tauri.localhost", "http://localhost:*"],
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
            output_path = await synthesize_sync(_mgr, req)
            return {"output_path": output_path}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

    @app.post("/synthesize/stream")
    async def synthesize_sse(req: SynthesizeRequest):
        """SSE 流式推理 — 推送进度事件"""
        return EventSourceResponse(synthesize_stream(_mgr, req))

    @app.post("/engine/{engine_name}/preload")
    async def preload_engine(engine_name: str):
        """预加载指定引擎"""
        if engine_name not in ("lightweight", "emotion"):
            raise HTTPException(status_code=400, detail=f"未知引擎: {engine_name}")
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

    return app


def main():
    """启动 TTS Server"""
    import uvicorn

    app = create_app()
    uvicorn.run(app, host="127.0.0.1", port=DEFAULT_PORT, log_level="info")


if __name__ == "__main__":
    main()
