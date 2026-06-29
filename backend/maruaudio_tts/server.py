"""FastAPI 应用 — MaruAudio TTS Server"""


import asyncio
import json
import logging
import os
import uuid
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

import base64
import re
import tempfile
from typing import Optional

from .engine_manager import EngineManager
from .inference import (
    synthesize_sync,
    synthesize_stream,
    _cache as _tts_cache,
    _OUTPUT_DIR,
    _OUTPUT_AUDIO_DIR,
    _OUTPUT_VIDEO_DIR,
    _OUTPUT_SUBTITLE_DIR,
    _OUTPUT_REF_AUDIO_DIR,
    _OUTPUT_EMO_AUDIO_DIR,
    _OUTPUT_PRESET_DIR,
)
from . import cloud_engine

# 参考音频体积上限（base64 解码后），防止超大 payload 撑爆内存
_MAX_AUDIO_BYTES = 50 * 1024 * 1024
_ALLOWED_AUDIO_EXT = {".wav", ".mp3", ".flac", ".m4a", ".ogg", ".aac", ".opus"}
# 可选 API Token：设置环境变量 MARUAUDIO_API_TOKEN 后，所有写操作需带 X-Maru-Token 头
_API_TOKEN = os.environ.get("MARUAUDIO_API_TOKEN", "").strip()


def _decode_base64_audio(req: "SynthesizeRequest") -> tuple["SynthesizeRequest", Optional[str]]:
    """解码 base64 参考音频到受控临时文件，返回 (req, 临时文件路径或 None)。

    调用方负责在请求结束时清理返回的临时文件（按请求隔离，杜绝并发竞态）。
    """
    if not req.speaker_audio_base64:
        return req, None
    b64 = req.speaker_audio_base64
    if (len(b64) * 3) // 4 > _MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="参考音频过大")
    ext = (req.speaker_audio_ext or "wav").lstrip(".").lower()
    if f".{ext}" not in _ALLOWED_AUDIO_EXT:
        ext = "wav"
    try:
        audio_bytes = base64.b64decode(b64)
    except Exception:
        raise HTTPException(status_code=400, detail="参考音频编码无效")
    if len(audio_bytes) > _MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="参考音频过大")
    _OUTPUT_REF_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    tmp = tempfile.NamedTemporaryFile(
        suffix=f".{ext}", prefix="cloud_ref_", dir=str(_OUTPUT_REF_AUDIO_DIR), delete=False
    )
    tmp.write(audio_bytes)
    tmp.close()
    req.speaker_audio_path = tmp.name
    req.speaker_audio_base64 = None
    logger.info("云端转发音频已解码到: %s (%d bytes)", tmp.name, len(audio_bytes))
    return req, tmp.name


def _safe_unlink(path: Optional[str]) -> None:
    """静默删除临时文件（按请求隔离的清理）。"""
    if not path:
        return
    try:
        os.unlink(path)
    except OSError:
        pass


def _validate_input_file(path: str, allowed_ext: set[str]) -> str:
    """校验输入文件：必须真实存在、是文件、扩展名合法。返回规范化绝对路径。"""
    if not path or not isinstance(path, str):
        raise HTTPException(status_code=400, detail="文件路径无效")
    real = os.path.realpath(path)
    if not os.path.isfile(real):
        raise HTTPException(status_code=400, detail="文件不存在或不可读")
    ext = os.path.splitext(real)[1].lower()
    if allowed_ext and ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"不支持的文件类型: {ext}")
    return real


def _validate_output_path(path: str, base_dir, allowed_ext: set[str]) -> str:
    """校验输出路径：必须落在 base_dir 内、无路径遍历、扩展名合法。"""
    base_real = os.path.realpath(str(base_dir))
    real = os.path.realpath(path)
    if not (real == base_real or real.startswith(base_real + os.sep)):
        raise HTTPException(status_code=400, detail="输出路径越界")
    ext = os.path.splitext(real)[1].lower()
    if allowed_ext and ext not in allowed_ext:
        raise HTTPException(status_code=400, detail="输出文件类型不允许")
    return real


def _validate_api_base(url: str) -> None:
    """校验外部 API 地址：仅允许 http(s)，杜绝 file:// 等奇异 scheme（不封内网，兼容本地 LLM）。"""
    from urllib.parse import urlparse

    try:
        p = urlparse(url)
    except Exception:
        raise HTTPException(status_code=400, detail="API 地址无效")
    if p.scheme not in ("http", "https") or not p.hostname:
        raise HTTPException(status_code=400, detail="API 地址必须是合法的 http(s) URL")
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
            r"|https://tauri\.localhost"
            r"|https?://(?:localhost|127\.0\.0\.1)(?::1420)?"
            r")$"
        ),
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def _enforce_token(request, call_next):
        # 仅当设置 MARUAUDIO_API_TOKEN 时启用；只读 GET/HEAD/OPTIONS 放行，写操作需校验
        if _API_TOKEN and request.method not in ("GET", "HEAD", "OPTIONS"):
            if request.headers.get("X-Maru-Token", "") != _API_TOKEN:
                from fastapi.responses import JSONResponse
                return JSONResponse(status_code=401, content={"detail": "未授权"})
        return await call_next(request)

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
        req, tmp_ref = _decode_base64_audio(req)
        if tmp_ref is None and req.speaker_audio_path:
            _validate_input_file(req.speaker_audio_path, _ALLOWED_AUDIO_EXT)
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
                    max_mel_tokens=req.max_mel_tokens,
                )
            else:
                output_path = await synthesize_sync(_mgr, req)
            return {"output_path": output_path}
        except HTTPException:
            raise
        except Exception:
            logger.exception("synthesize failed")
            raise HTTPException(status_code=500, detail="合成失败，请稍后重试")
        finally:
            _safe_unlink(tmp_ref)

    @app.post("/synthesize/stream")
    async def synthesize_sse(req: SynthesizeRequest):
        """SSE 流式推理 — 推送进度事件"""

        async def _validated_stream():
            tmp_ref = None
            try:
                nonlocal req
                req, tmp_ref = _decode_base64_audio(req)
                if tmp_ref is None and req.speaker_audio_path:
                    _validate_input_file(req.speaker_audio_path, _ALLOWED_AUDIO_EXT)
            except HTTPException as exc:
                yield f"data: {ErrorEvent(message=exc.detail).model_dump_json()}\n\n"
                return
            except Exception as exc:
                yield f"data: {ErrorEvent(message=str(exc)[:200]).model_dump_json()}\n\n"
                return

            try:
                if req.engine == "cloud":
                    gen = cloud_engine.synthesize_stream(
                        text=req.text,
                        speaker_audio_path=req.speaker_audio_path,
                        emotion_method=req.emotion_method,
                        emotion_vector=req.emotion_vector,
                        emotion_text=req.emotion_text,
                        emotion_audio_path=req.emotion_audio_path,
                        emo_alpha=req.emo_alpha,
                        temperature=req.temperature,
                        top_p=req.top_p,
                        max_mel_tokens=req.max_mel_tokens,
                    )
                else:
                    gen = synthesize_stream(_mgr, req)
                async for chunk in gen:
                    yield chunk
            finally:
                _safe_unlink(tmp_ref)

        return EventSourceResponse(_validated_stream())

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

        _validate_input_file(req.input_path, set(AUDIO_EXTENSIONS) | set(VIDEO_EXTENSIONS))
        _OUTPUT_REF_AUDIO_DIR.mkdir(parents=True, exist_ok=True)
        if req.output_path:
            output_path = _validate_output_path(req.output_path, _OUTPUT_REF_AUDIO_DIR, {".wav"})
        else:
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
        _validate_input_file(req.input_path, set(AUDIO_EXTENSIONS) | set(VIDEO_EXTENSIONS))
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

    # ==================== 预置样音 ====================

    @app.get("/presets")
    async def list_presets():
        """列出所有预置样音"""
        preset_dir = _OUTPUT_PRESET_DIR
        metadata_file = preset_dir / "metadata.json"

        if not metadata_file.exists():
            return {"presets": [], "count": 0}

        try:
            data = json.loads(metadata_file.read_text(encoding="utf-8"))
            for item in data:
                fp = item.get("file_path", "")
                if fp and not os.path.isabs(fp):
                    item["file_path"] = str(preset_dir / os.path.basename(fp))
                elif fp:
                    actual = preset_dir / os.path.basename(fp)
                    if actual.exists():
                        item["file_path"] = str(actual)
                cp = item.get("cover", "")
                if cp and not os.path.isabs(cp):
                    cover_actual = preset_dir / "covers" / os.path.basename(cp)
                    item["cover"] = str(cover_actual if cover_actual.exists() else preset_dir / os.path.basename(cp))
                elif cp:
                    cover_actual = preset_dir / "covers" / os.path.basename(cp)
                    if cover_actual.exists():
                        item["cover"] = str(cover_actual)
            return {"presets": data, "count": len(data)}
        except Exception as e:
            logger.warning("Failed to load presets: %s", e)
            return {"presets": [], "count": 0}

    # ==================== LLM 台词拆分 ====================

    class LlmModelsRequest(BaseModel):
        api_base_url: str
        api_key: str

    @app.post("/llm-models")
    async def list_llm_models(req: LlmModelsRequest):
        """查询 LLM 可用模型列表"""
        import httpx

        _validate_api_base(req.api_base_url)
        url = f"{req.api_base_url.rstrip('/')}/models"
        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(15.0)) as client:
                resp = await client.get(
                    url,
                    headers={"Authorization": f"Bearer {req.api_key}"},
                )
                if resp.status_code != 200:
                    raise HTTPException(status_code=resp.status_code, detail=f"LLM API 错误: {resp.text[:300]}")

                data = resp.json()
                models = []
                for item in data.get("data", []):
                    model_id = item.get("id", "")
                    if model_id:
                        models.append(model_id)
                models.sort()
                return {"models": models, "count": len(models)}

        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="无法连接 LLM API")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="LLM API 响应超时")

    class SplitLinesRequest(BaseModel):
        text: str = Field(..., min_length=1, max_length=100000)
        api_base_url: str = Field(..., description="OpenAI 兼容 API 的 base URL")
        api_key: str = Field(..., description="API Key")
        model: str = Field(default="gpt-4o-mini", description="模型名称")
        roles: list[str] = Field(default_factory=list, description="已知角色列表")
        emotions: list[str] = Field(
            default_factory=lambda: ["平静", "开心", "悲伤", "愤怒", "紧张", "惊讶", "冷漠", "坚定", "害怕"],
        )
        strengths: list[str] = Field(default_factory=lambda: ["微弱", "中等", "强烈"])
        custom_prompt: Optional[str] = Field(default=None, description="自定义 system prompt，传入后覆盖内置模板。变量占位符：{roles} {emotions} {strengths} {text}")

    @app.post("/split-lines")
    async def split_lines(req: SplitLinesRequest):
        """LLM 台词拆分 — 将小说/剧本文本拆分为角色台词"""
        import httpx

        _validate_api_base(req.api_base_url)
        if req.custom_prompt:
            # 显式替换而非 str.format：自定义模板常含 JSON 示例的字面花括号，
            # str.format 会把它们误当占位符解析并抛 KeyError/ValueError（导致 500）。
            _roles = ', '.join(req.roles) if req.roles else '（未提供，请自行识别）'
            prompt = (
                req.custom_prompt
                .replace('{roles}', _roles)
                .replace('{emotions}', ', '.join(req.emotions))
                .replace('{strengths}', ', '.join(req.strengths))
                .replace('{text}', req.text)
            )
        else:
            prompt = f"""你的任务是将给定的文本内容划分为角色台词和旁白，输出结构化 JSON 数组。

规则：
1. 识别所有角色对话（引号/破折号/冒号标记），非对话内容标记为"旁白"。
2. 若角色在已知列表中，使用该角色名；否则根据上下文推断角色名。
3. 相邻同角色内容可合并，但单条不超过 150 字。
4. 根据上下文推断每条台词的情绪和情绪强度。
5. 旁白的情绪统一为"平静"，强度为"中等"。

可能的角色列表：{', '.join(req.roles) if req.roles else '（未提供，请自行识别）'}
可能的情绪列表：{', '.join(req.emotions)}
可能的强度列表：{', '.join(req.strengths)}

输出格式（严格 JSON 数组）：
[
  {{"role_name": "角色名", "text_content": "台词内容", "emotion_name": "情绪", "strength_name": "强度"}},
  ...
]

文本原文：
{req.text}"""

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
                resp = await client.post(
                    f"{req.api_base_url.rstrip('/')}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {req.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": req.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                    },
                )
                if resp.status_code != 200:
                    raise HTTPException(status_code=resp.status_code, detail=f"LLM API 错误: {resp.text[:500]}")

                data = resp.json()
                content = data["choices"][0]["message"]["content"]

                # 提取 JSON 数组（可能包含 markdown 代码块）
                json_match = re.search(r'\[[\s\S]*\]', content)
                if not json_match:
                    raise HTTPException(status_code=422, detail="LLM 未返回有效 JSON 数组")

                result = json.loads(json_match.group())
                return {"lines": result, "count": len(result)}

        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="无法连接 LLM API")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="LLM API 响应超时")
        except json.JSONDecodeError:
            raise HTTPException(status_code=422, detail="LLM 返回内容无法解析为 JSON")
        except KeyError as e:
            raise HTTPException(status_code=422, detail=f"LLM 返回格式异常: {e}")

    # ==================== 术语词汇表 ====================

    @app.get("/glossary")
    async def get_glossary():
        """读取术语词汇表"""
        glossary_path = Path(os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "checkpoints", "v20", "glossary.yaml"
        ))
        if not glossary_path.is_file():
            return {"entries": [], "path": str(glossary_path)}
        try:
            import yaml
            with open(glossary_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)
            entries = []
            if isinstance(data, dict):
                for k, v in data.items():
                    entries.append({"term": k, "replacement": v})
            return {"entries": entries, "path": str(glossary_path)}
        except Exception as e:
            return {"entries": [], "path": str(glossary_path), "error": str(e)}

    class GlossaryUpdateRequest(BaseModel):
        entries: list[dict] = Field(..., description="[{term: str, replacement: str}, ...]")

    @app.post("/glossary")
    async def update_glossary(req: GlossaryUpdateRequest):
        """更新术语词汇表"""
        glossary_path = Path(os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "checkpoints", "v20", "glossary.yaml"
        ))
        glossary_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            import yaml
            data = {e["term"]: e["replacement"] for e in req.entries if e.get("term")}
            with open(glossary_path, "w", encoding="utf-8") as f:
                yaml.dump(data, f, allow_unicode=True, default_flow_style=False)
            return {"status": "ok", "count": len(data), "message": "词汇表已保存，重启引擎后生效"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"保存失败: {e}")

    # ==================== 字幕翻译 ====================

    class TranslateSubtitleRequest(BaseModel):
        text: str = Field(..., min_length=1, max_length=100000)
        target_language: str = Field(default="en", description="目标语言代码 (en/zh/ja/ko等)")
        api_base_url: str = Field(..., description="OpenAI 兼容 API 的 base URL")
        api_key: str = Field(..., description="API Key")
        model: str = Field(default="gpt-4o-mini", description="模型名称")

    @app.post("/subtitle/translate")
    async def translate_subtitle(req: TranslateSubtitleRequest):
        """翻译字幕文本 — 保留时间码格式"""
        import httpx

        _validate_api_base(req.api_base_url)
        lang_names = {
            "en": "English", "zh": "简体中文", "ja": "日本語",
            "ko": "한국어", "fr": "Français", "de": "Deutsch",
            "es": "Español", "ru": "Русский",
        }
        lang_label = lang_names.get(req.target_language, req.target_language)

        prompt = f"""Translate the following subtitle text to {lang_label}.
Keep the original SRT/VTT timestamp format unchanged. Only translate the text content.
If a line contains only timestamps or sequence numbers, keep them as-is.

Original:
{req.text}"""

        try:
            async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
                resp = await client.post(
                    f"{req.api_base_url.rstrip('/')}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {req.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": req.model,
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                    },
                )
                if resp.status_code != 200:
                    raise HTTPException(status_code=resp.status_code, detail=f"LLM API 错误: {resp.text[:500]}")

                data = resp.json()
                translated = data["choices"][0]["message"]["content"]
                return {"translated_text": translated, "target_language": req.target_language}

        except httpx.ConnectError:
            raise HTTPException(status_code=503, detail="无法连接 LLM API")
        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="LLM API 响应超时")

    # ==================== 字幕时间优化 ====================

    class OptimizeTimingRequest(BaseModel):
        segments: list[dict] = Field(..., description="字幕段列表 [{start_ms, end_ms, text}]")
        min_gap_ms: int = Field(default=100, ge=0, le=2000, description="段间最小间隔")
        min_duration_ms: int = Field(default=500, ge=200, le=5000, description="单段最小时长")
        max_duration_ms: int = Field(default=8000, ge=2000, le=30000, description="单段最大时长")

    @app.post("/subtitle/optimize-timing")
    async def optimize_timing(req: OptimizeTimingRequest):
        """优化字幕时间轴 — 修复重叠、过短、过长等问题"""
        segments = req.segments
        if not segments:
            return {"segments": [], "fixes": 0}

        fixes = 0
        result = []
        for i, seg in enumerate(segments):
            s = dict(seg)
            start = s.get("start_ms", 0)
            end = s.get("end_ms", start + 1000)

            if end - start < req.min_duration_ms:
                end = start + req.min_duration_ms
                fixes += 1

            if end - start > req.max_duration_ms:
                end = start + req.max_duration_ms
                fixes += 1

            if i > 0 and result:
                prev_end = result[-1]["end_ms"]
                if start < prev_end:
                    start = prev_end + req.min_gap_ms
                    if start > end:
                        end = start + req.min_duration_ms
                    fixes += 1
                elif start - prev_end < req.min_gap_ms:
                    start = prev_end + req.min_gap_ms
                    if start > end:
                        end = start + req.min_duration_ms
                    fixes += 1

            s["start_ms"] = start
            s["end_ms"] = end
            result.append(s)

        return {"segments": result, "fixes": fixes}

    @app.get("/cache/stats")
    async def cache_stats():
        return _tts_cache.stats()

    @app.post("/cache/evict")
    async def cache_evict(max_age_days: int = 30, max_size_mb: int = 0):
        removed = _tts_cache.evict(max_age_days=max_age_days, max_size_mb=max_size_mb if max_size_mb > 0 else None)
        return {"removed": removed, **_tts_cache.stats()}

    @app.delete("/cache/clear")
    async def cache_clear():
        removed = _tts_cache.clear()
        return {"removed": removed}

    return app


def main():
    """启动 TTS Server"""
    import uvicorn

    app = create_app()
    uvicorn.run(app, host="127.0.0.1", port=DEFAULT_PORT, log_level="info")


if __name__ == "__main__":
    main()
