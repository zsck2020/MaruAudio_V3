"""字幕模块数据实体

设计参考: V2 (18884e6) backend/subtitle/entities.py
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ASRModelEnum(str, Enum):
    """ASR 模型枚举"""

    BIJIAN = "BIJIAN"
    """必剪 (Bilibili Cut) 免费云端 ASR"""

    # 预留扩展：whisper / paraformer 可在此追加
    FASTER_WHISPER = "FasterWhisper"
    WHISPER_API = "WhisperAPI"


class TranscribeConfig(BaseModel):
    """转录配置"""

    asr_model: ASRModelEnum = Field(
        default=ASRModelEnum.BIJIAN,
        description="ASR 引擎，默认使用必剪（免费）",
    )
    language: str = Field(default="zh", description="识别语言")
    need_word_timestamp: bool = Field(
        default=False, description="生成词级时间戳（仅部分 ASR 引擎支持）"
    )
    timeout_seconds: int = Field(
        default=30, ge=5, le=600, description="单次 HTTP 请求超时"
    )


class TaskStatus(str, Enum):
    """长任务状态"""

    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
