"""字幕生成服务

设计参考: V2 (18884e6) backend/subtitle/
重写要点:
- 去掉 Qt 信号依赖，纯回调
- asyncio + httpx 替代 requests
- 暴露 transcribe_audio / transcribe_video 异步入口
- ASRData 复用 V2 数据结构（纯 Python，无 Qt）
"""

from .asr_data import ASRData, ASRSegment
from .entities import ASRModelEnum, TranscribeConfig
from .transcribe import transcribe_audio, transcribe_video

__all__ = [
    "ASRData",
    "ASRSegment",
    "ASRModelEnum",
    "TranscribeConfig",
    "transcribe_audio",
    "transcribe_video",
]
