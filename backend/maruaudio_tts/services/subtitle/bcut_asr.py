"""必剪 (Bilibili Cut) ASR 客户端

设计参考: V2 (18884e6) backend/subtitle/asr/bcut.py
重写要点:
- httpx 替代 requests（原生异步）
- asyncio.sleep 替代 time.sleep
- 类型注解齐全
- 错误抛 RuntimeError，由上层映射成 SSE error event
"""

from __future__ import annotations

import asyncio
import json
import logging
from pathlib import Path
from typing import Awaitable, Callable, Optional

import httpx

from .asr_data import ASRData, ASRSegment

logger = logging.getLogger(__name__)

_API_BASE = "https://member.bilibili.com/x/bcut/rubick-interface"
_API_REQ_UPLOAD = f"{_API_BASE}/resource/create"
_API_COMMIT_UPLOAD = f"{_API_BASE}/resource/create/complete"
_API_CREATE_TASK = f"{_API_BASE}/task"
_API_QUERY_RESULT = f"{_API_BASE}/task/result"

_HEADERS = {
    "User-Agent": "Bilibili/1.0.0 (https://www.bilibili.com)",
    "Content-Type": "application/json",
}

ProgressCallback = Callable[[float, str], Awaitable[None]]
"""异步进度回调: callback(progress 0-1, message)"""


class BcutASR:
    """必剪 ASR 客户端"""

    def __init__(
        self,
        audio_path: str,
        need_word_timestamp: bool = False,
        timeout_seconds: int = 30,
    ) -> None:
        self.audio_path = audio_path
        self.need_word_timestamp = need_word_timestamp
        self.timeout_seconds = timeout_seconds

        path = Path(audio_path)
        if not path.exists():
            raise FileNotFoundError(f"音频文件不存在: {audio_path}")
        self._file_bytes = path.read_bytes()

        # 上传状态
        self._in_boss_key: Optional[str] = None
        self._resource_id: Optional[str] = None
        self._upload_id: Optional[str] = None
        self._upload_urls: list[str] = []
        self._per_size: int = 0
        self._etags: list[str] = []
        self._download_url: Optional[str] = None
        self._task_id: Optional[str] = None

    async def transcribe(
        self,
        progress: Optional[ProgressCallback] = None,
    ) -> ASRData:
        """执行完整转录流程"""

        async def emit(p: float, msg: str) -> None:
            if progress is not None:
                await progress(p, msg)

        timeout = httpx.Timeout(self.timeout_seconds, read=60.0)
        async with httpx.AsyncClient(timeout=timeout, headers=_HEADERS) as client:
            await emit(0.05, "申请上传…")
            await self._request_upload(client)

            await emit(0.15, "上传音频分片…")
            await self._upload_parts(client, progress)

            await emit(0.45, "提交上传…")
            await self._commit_upload(client)

            await emit(0.5, "创建转录任务…")
            await self._create_task(client)

            await emit(0.55, "正在转录…")
            return await self._poll_result(client, progress)

    async def _request_upload(self, client: httpx.AsyncClient) -> None:
        payload = {
            "type": 2,
            "name": "audio.mp3",
            "size": len(self._file_bytes),
            "ResourceFileType": "mp3",
            "model_id": "8",
        }
        resp = await client.post(_API_REQ_UPLOAD, content=json.dumps(payload))
        resp.raise_for_status()
        data = resp.json()["data"]
        self._in_boss_key = data["in_boss_key"]
        self._resource_id = data["resource_id"]
        self._upload_id = data["upload_id"]
        self._upload_urls = data["upload_urls"]
        self._per_size = data["per_size"]

    async def _upload_parts(
        self,
        client: httpx.AsyncClient,
        progress: Optional[ProgressCallback],
    ) -> None:
        total = len(self._upload_urls)
        for idx, url in enumerate(self._upload_urls):
            start = idx * self._per_size
            end = start + self._per_size
            chunk = self._file_bytes[start:end]

            put_resp = await client.put(
                url, content=chunk, headers={"User-Agent": _HEADERS["User-Agent"]}, timeout=60.0
            )
            put_resp.raise_for_status()
            etag = put_resp.headers.get("Etag", "")
            if etag:
                self._etags.append(etag)

            if progress is not None:
                # 上传阶段占进度 0.15 → 0.45
                p = 0.15 + 0.3 * (idx + 1) / max(1, total)
                await progress(p, f"上传分片 {idx + 1}/{total}…")

    async def _commit_upload(self, client: httpx.AsyncClient) -> None:
        payload = {
            "InBossKey": self._in_boss_key,
            "ResourceId": self._resource_id,
            "Etags": ",".join(e for e in self._etags if e),
            "UploadId": self._upload_id,
            "model_id": "8",
        }
        resp = await client.post(_API_COMMIT_UPLOAD, content=json.dumps(payload))
        resp.raise_for_status()
        self._download_url = resp.json()["data"]["download_url"]

    async def _create_task(self, client: httpx.AsyncClient) -> None:
        resp = await client.post(
            _API_CREATE_TASK,
            json={"resource": self._download_url, "model_id": "8"},
        )
        resp.raise_for_status()
        self._task_id = resp.json()["data"]["task_id"]

    async def _poll_result(
        self,
        client: httpx.AsyncClient,
        progress: Optional[ProgressCallback],
        max_polls: int = 500,
        interval: float = 1.0,
    ) -> ASRData:
        last_resp: Optional[dict] = None
        for i in range(max_polls):
            params = {"model_id": 7, "task_id": self._task_id}
            resp = await client.get(_API_QUERY_RESULT, params=params)
            resp.raise_for_status()
            data = resp.json()["data"]
            last_resp = data

            if data.get("state") == 4:
                break

            if progress is not None:
                p = 0.55 + 0.4 * (i / max_polls)
                await progress(p, f"转录中… ({i}/{max_polls})")
            await asyncio.sleep(interval)
        else:
            raise RuntimeError(f"必剪 ASR 超时（已等待 {max_polls} 秒）")

        if last_resp is None or "result" not in last_resp:
            raise RuntimeError("必剪 ASR 未返回结果")

        if progress is not None:
            await progress(0.95, "解析结果…")

        return self._parse_result(last_resp["result"])

    def _parse_result(self, raw: str) -> ASRData:
        payload = json.loads(raw)
        segments: list[ASRSegment] = []
        for u in payload.get("utterances", []):
            if self.need_word_timestamp:
                for w in u.get("words", []):
                    segments.append(ASRSegment(
                        text=w["label"].strip(),
                        start_time=int(w["start_time"]),
                        end_time=int(w["end_time"]),
                    ))
            else:
                segments.append(ASRSegment(
                    text=u.get("transcript", "").strip(),
                    start_time=int(u.get("start_time", 0)),
                    end_time=int(u.get("end_time", 0)),
                ))
        return ASRData(segments=segments)
