"""云端 TTS 引擎 — 仙宫云上自部署的 IndexTTS 2.0 远程实例

设计要点:
- 用户面统一称「云端引擎」，不暴露底层是哪家算力平台
- 云端引擎本质上是远程的 IndexTTS 2.0 推理服务（与本地情感引擎协议一致），
  跑在用户自有的 GPU 实例上（默认仙宫云）
- 配置仅需两个环境变量：
    XIANGONG_TTS_BASE   — 远程 server 的 base URL（如 http://1.2.3.4:9880）
    XIANGONG_TTS_TOKEN  — 可选鉴权 Bearer Token，没配就裸 HTTP
- 协议与本地后端的 `/synthesize/stream` 完全一致，相当于把请求"扔到远端 GPU"
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any, AsyncIterator, Awaitable, Callable, Optional

import httpx

logger = logging.getLogger(__name__)

ProgressCallback = Callable[[float, str], Awaitable[None]]


def _get_base_url() -> Optional[str]:
    """获取远程 server 的 base URL（去掉末尾斜杠）"""
    raw = os.environ.get("XIANGONG_TTS_BASE")
    if not raw:
        return None
    return raw.rstrip("/")


def _get_token() -> Optional[str]:
    """获取鉴权 Token（可选）"""
    return os.environ.get("XIANGONG_TTS_TOKEN")


def _build_headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    token = _get_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def is_configured() -> bool:
    """判断云端引擎是否已配置远程实例端点"""
    return _get_base_url() is not None


async def check_availability() -> dict:
    """检查云端引擎可用性

    Returns:
        {"engine": "cloud", "available": bool, "message": str}
    """
    base = _get_base_url()
    if not base:
        return {
            "engine": "cloud",
            "available": False,
            "message": "未配置远程实例端点（XIANGONG_TTS_BASE）",
        }

    url = f"{base}/health"
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            resp = await client.get(url, headers=_build_headers())
            if resp.status_code == 200:
                return {
                    "engine": "cloud",
                    "available": True,
                    "message": "云端引擎可用",
                }
            return {
                "engine": "cloud",
                "available": False,
                "message": f"远程服务返回 {resp.status_code}",
            }
    except httpx.ConnectError:
        return {
            "engine": "cloud",
            "available": False,
            "message": "无法连接远程实例（请检查端点是否运行）",
        }
    except httpx.TimeoutException:
        return {
            "engine": "cloud",
            "available": False,
            "message": "远程实例响应超时",
        }
    except Exception as exc:  # pragma: no cover - 兜底
        logger.warning("check_cloud failed: %s", exc)
        return {
            "engine": "cloud",
            "available": False,
            "message": f"远程检查异常：{exc}",
        }


def _build_remote_payload(
    text: str,
    speaker_audio_path: Optional[str],
    emotion_method: str,
    emotion_vector: Optional[list[float]],
    emotion_text: Optional[str],
    emotion_audio_path: Optional[str],
    emo_alpha: float,
    temperature: float,
    top_p: float,
) -> dict[str, Any]:
    """构造转发到远程的 SynthesizeRequest payload

    远程实例运行的是本项目同款 backend.maruaudio_tts.server，所以请求体
    与本地后端 `/synthesize/stream` 一致：engine 强制为 "emotion"。
    """
    return {
        "engine": "emotion",
        "text": text,
        "speaker_audio_path": speaker_audio_path or "",
        "inference_mode": "normal",
        "interval_silence": 200,
        "max_text_tokens_per_segment": 120,
        "bucket_max_size": 4,
        "emotion_method": emotion_method,
        "emotion_vector": emotion_vector,
        "emotion_text": emotion_text,
        "emotion_audio_path": emotion_audio_path,
        "emo_alpha": emo_alpha,
        "temperature": temperature,
        "top_p": top_p,
        "top_k": 30,
        "num_beams": 3,
        "repetition_penalty": 10.0,
        "max_mel_tokens": 600,
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
    """同步式云端推理 — 内部走 SSE，收到 complete 事件后返回输出路径"""
    final_path: Optional[str] = None
    async for evt in synthesize_stream(
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
    ):
        if evt.get("type") == "complete":
            final_path = evt.get("output_path")
        elif evt.get("type") == "error":
            raise RuntimeError(str(evt.get("message", "云端推理失败")))

    if not final_path:
        raise RuntimeError("云端推理结束但未返回输出路径")
    return final_path


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
) -> AsyncIterator[dict]:
    """流式云端推理 — 转发到远程 IndexTTS 2.0 实例的 SSE 接口

    Yields:
        SSE 事件 dict（与本地后端一致）：
            {"type": "progress", "progress": float, "message": str, ...}
            {"type": "complete", "output_path": str, ...}
            {"type": "error", "message": str}
    """
    base = _get_base_url()
    if not base:
        yield {"type": "error", "message": "未配置远程实例端点（XIANGONG_TTS_BASE）"}
        return

    payload = _build_remote_payload(
        text=text,
        speaker_audio_path=speaker_audio_path,
        emotion_method=emotion_method,
        emotion_vector=emotion_vector,
        emotion_text=emotion_text,
        emotion_audio_path=emotion_audio_path,
        emo_alpha=emo_alpha,
        temperature=temperature,
        top_p=top_p,
    )

    url = f"{base}/synthesize/stream"
    headers = _build_headers()

    async def emit(p: float, msg: str) -> None:
        if progress is not None:
            await progress(p, msg)

    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(600.0)) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                if resp.status_code != 200:
                    body = await resp.aread()
                    text_body = body.decode("utf-8", errors="ignore")
                    yield {
                        "type": "error",
                        "message": f"云端服务返回 {resp.status_code}: {text_body[:200]}",
                    }
                    return

                await emit(0.05, "已连接云端实例…")

                buffer = ""
                async for chunk in resp.aiter_text():
                    buffer += chunk
                    while "\n\n" in buffer:
                        raw_event, buffer = buffer.split("\n\n", 1)
                        for line in raw_event.splitlines():
                            if not line.startswith("data: "):
                                continue
                            data = line[len("data: "):]
                            try:
                                evt = json.loads(data)
                            except json.JSONDecodeError:
                                logger.warning("远程 SSE 解析失败: %r", data[:120])
                                continue

                            if evt.get("type") == "progress" and progress is not None:
                                await emit(
                                    float(evt.get("progress", 0.0)),
                                    str(evt.get("message", "")),
                                )
                            yield evt
    except httpx.ConnectError:
        yield {"type": "error", "message": "无法连接云端实例（请检查端点）"}
    except httpx.TimeoutException:
        yield {"type": "error", "message": "云端实例响应超时"}
    except Exception as exc:
        logger.exception("cloud synthesize_stream failed")
        yield {"type": "error", "message": f"云端推理失败：{exc}"}
