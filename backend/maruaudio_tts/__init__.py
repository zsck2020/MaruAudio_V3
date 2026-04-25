"""MaruAudio TTS Server — 轻量 FastAPI 服务，封装 IndexTTS v1.5/v2.0 推理"""

from .server import create_app

__all__ = ["create_app"]
