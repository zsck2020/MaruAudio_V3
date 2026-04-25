"""Pydantic 请求/响应模型"""

from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, Field


class SynthesizeRequest(BaseModel):
    """TTS 推理请求"""

    # 引擎选择: "lightweight" (v1.5) | "emotion" (v2.0)
    engine: str = Field(default="lightweight", pattern=r"^(lightweight|emotion)$")

    # 文本
    text: str = Field(..., min_length=1, max_length=50000)

    # 说话人参考音频路径（本地绝对路径）
    speaker_audio_path: str

    # ---- v1.5 参数 ----
    # 推理模式: "normal" (逐句) | "batch" (桶化批处理)
    inference_mode: str = Field(default="batch", pattern=r"^(normal|batch)$")
    # 段间静音 (ms)
    interval_silence: int = Field(default=200, ge=0, le=5000)
    # 单段最大 token
    max_text_tokens_per_segment: int = Field(default=100, ge=20, le=500)
    # 分桶容量（仅 batch 模式）
    bucket_max_size: int = Field(default=4, ge=1, le=16)

    # ---- v2.0 参数 ----
    # 情感控制方式: "slider" | "text" | "audio"
    emotion_method: str = Field(default="slider", pattern=r"^(slider|text|audio)$")

    # 情感向量 [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]
    emotion_vector: Optional[list[float]] = Field(default=None, min_length=8, max_length=8)

    # 情感文本（emotion_method="text" 时使用）
    emotion_text: Optional[str] = None

    # 情感参考音频路径（emotion_method="audio" 时使用）
    emotion_audio_path: Optional[str] = None

    # 情感强度 alpha
    emo_alpha: float = Field(default=1.0, ge=0.0, le=1.0)

    # ---- 通用采样参数 ----
    temperature: float = Field(default=1.0, ge=0.0, le=2.0)
    top_p: float = Field(default=0.8, ge=0.0, le=1.0)
    top_k: int = Field(default=30, ge=0, le=100)
    num_beams: int = Field(default=3, ge=1, le=10)
    repetition_penalty: float = Field(default=10.0, ge=1.0, le=20.0)
    max_mel_tokens: int = Field(default=600, ge=100, le=2000)


class EngineStatus(BaseModel):
    """引擎状态"""

    engine: str
    available: bool
    message: str
    device: Optional[str] = None
    vram_mb: Optional[float] = None


class HealthResponse(BaseModel):
    """健康检查响应"""

    status: str = "ok"
    engines: list[EngineStatus] = []


class ProgressEvent(BaseModel):
    """SSE 进度事件"""

    type: str = "progress"
    progress: float = 0.0
    message: str = ""
    segment_current: int = 0
    segment_total: int = 0


class CompleteEvent(BaseModel):
    """SSE 完成事件"""

    type: str = "complete"
    output_path: str
    duration_seconds: float = 0.0
    rtf: float = 0.0


class ErrorEvent(BaseModel):
    """SSE 错误事件"""

    type: str = "error"
    message: str
