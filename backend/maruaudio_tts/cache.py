"""TTS 预合成缓存 — SQLite 本地缓存管理

相同文本+音色+引擎+核心参数的合成结果缓存到本地，
重复生成时直接返回缓存音频路径，跳过模型推理。
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import threading
import time
from pathlib import Path
from typing import Optional


_DB_NAME = "tts_cache.db"

_CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS tts_cache (
    fingerprint TEXT PRIMARY KEY,
    audio_path  TEXT NOT NULL,
    text_preview TEXT,
    engine      TEXT,
    created_at  INTEGER NOT NULL,
    last_hit_at INTEGER NOT NULL,
    size_bytes  INTEGER DEFAULT 0,
    hit_count   INTEGER DEFAULT 0
);
"""

_CREATE_INDEX = """
CREATE INDEX IF NOT EXISTS idx_cache_created ON tts_cache(created_at);
"""


def _speaker_key(path: Optional[str]) -> str:
    """用文件名+大小+修改时间标识参考音频，避免异目录同名文件误命中缓存。"""
    if not path:
        return ""
    try:
        st = os.stat(path)
        return f"{os.path.basename(path)}:{st.st_size}:{int(st.st_mtime)}"
    except OSError:
        return os.path.basename(path)


def _compute_fingerprint(
    text: str,
    engine: str,
    speaker_audio_path: str,
    temperature: float,
    top_p: float,
    top_k: int,
    interval_silence: int,
    emotion_method: Optional[str] = None,
    emotion_text: Optional[str] = None,
    emotion_vector: Optional[list[float]] = None,
    emo_alpha: float = 0.6,
    emotion_audio_path: Optional[str] = None,
    max_mel_tokens: int = 0,
    num_beams: int = 0,
    repetition_penalty: float = 0.0,
    inference_mode: str = "",
    bucket_max_size: int = 0,
    max_text_tokens_per_segment: int = 0,
) -> str:
    payload = {
        "text": text,
        "engine": engine,
        "speaker": _speaker_key(speaker_audio_path),
        "temperature": round(temperature, 2),
        "top_p": round(top_p, 2),
        "top_k": top_k,
        "interval_silence": interval_silence,
        "emotion_method": emotion_method,
        "emotion_text": emotion_text,
        "emotion_vector": [round(v, 2) for v in emotion_vector] if emotion_vector else None,
        "emo_alpha": round(emo_alpha, 2),
        "emotion_audio": _speaker_key(emotion_audio_path) if emotion_audio_path else None,
        # 以下参数同样影响输出，必须纳入指纹，否则换参数会错误命中旧音频
        "max_mel_tokens": max_mel_tokens,
        "num_beams": num_beams,
        "repetition_penalty": round(repetition_penalty, 2),
        "inference_mode": inference_mode,
        "bucket_max_size": bucket_max_size,
        "max_text_tokens_per_segment": max_text_tokens_per_segment,
    }
    raw = json.dumps(payload, sort_keys=True, ensure_ascii=False)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


class TTSCache:
    def __init__(self, db_dir: str | Path | None = None) -> None:
        if db_dir is None:
            db_dir = Path(__file__).resolve().parent.parent / "output"
        self._db_path = Path(db_dir) / _DB_NAME
        self._db_path.parent.mkdir(parents=True, exist_ok=True)
        self._local = threading.local()
        self._init_db()

    def _get_conn(self) -> sqlite3.Connection:
        conn = getattr(self._local, "conn", None)
        if conn is None:
            conn = sqlite3.connect(str(self._db_path), check_same_thread=False)
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
            self._local.conn = conn
        return conn

    def _init_db(self) -> None:
        conn = self._get_conn()
        conn.execute(_CREATE_TABLE)
        conn.execute(_CREATE_INDEX)
        conn.commit()

    def compute_fingerprint(self, **kwargs) -> str:
        return _compute_fingerprint(**kwargs)

    def lookup(self, fingerprint: str) -> Optional[str]:
        conn = self._get_conn()
        row = conn.execute(
            "SELECT audio_path FROM tts_cache WHERE fingerprint = ?",
            (fingerprint,),
        ).fetchone()
        if row is None:
            return None
        audio_path = row[0]
        if not os.path.isfile(audio_path):
            conn.execute("DELETE FROM tts_cache WHERE fingerprint = ?", (fingerprint,))
            conn.commit()
            return None
        conn.execute(
            "UPDATE tts_cache SET hit_count = hit_count + 1, last_hit_at = ? WHERE fingerprint = ?",
            (int(time.time()), fingerprint),
        )
        conn.commit()
        return audio_path

    def store(
        self,
        fingerprint: str,
        audio_path: str,
        text_preview: str = "",
        engine: str = "",
    ) -> None:
        size_bytes = 0
        try:
            size_bytes = os.path.getsize(audio_path)
        except OSError:
            pass
        now = int(time.time())
        conn = self._get_conn()
        conn.execute(
            """INSERT OR REPLACE INTO tts_cache
               (fingerprint, audio_path, text_preview, engine, created_at, last_hit_at, size_bytes, hit_count)
               VALUES (?, ?, ?, ?, ?, ?, ?, 0)""",
            (fingerprint, audio_path, text_preview[:50], engine, now, now, size_bytes),
        )
        conn.commit()

    def evict(self, max_age_days: int | None = None, max_size_mb: int | None = None) -> int:
        conn = self._get_conn()
        removed = 0
        if max_age_days is not None and max_age_days > 0:
            cutoff = int(time.time()) - max_age_days * 86400
            rows = conn.execute(
                "SELECT fingerprint, audio_path FROM tts_cache WHERE created_at < ?",
                (cutoff,),
            ).fetchall()
            for fp, path in rows:
                try:
                    if os.path.isfile(path):
                        os.remove(path)
                except OSError:
                    pass
                conn.execute("DELETE FROM tts_cache WHERE fingerprint = ?", (fp,))
                removed += 1
            conn.commit()
        if max_size_mb is not None and max_size_mb > 0:
            total = conn.execute("SELECT COALESCE(SUM(size_bytes), 0) FROM tts_cache").fetchone()[0]
            limit = max_size_mb * 1024 * 1024
            if total > limit:
                excess = total - limit
                rows = conn.execute(
                    "SELECT fingerprint, audio_path, size_bytes FROM tts_cache ORDER BY last_hit_at ASC",
                ).fetchall()
                for fp, path, sz in rows:
                    if excess <= 0:
                        break
                    try:
                        if os.path.isfile(path):
                            os.remove(path)
                    except OSError:
                        pass
                    conn.execute("DELETE FROM tts_cache WHERE fingerprint = ?", (fp,))
                    excess -= sz
                    removed += 1
                conn.commit()
        return removed

    def clear(self) -> int:
        conn = self._get_conn()
        rows = conn.execute("SELECT audio_path FROM tts_cache").fetchall()
        for (path,) in rows:
            try:
                if os.path.isfile(path):
                    os.remove(path)
            except OSError:
                pass
        count = conn.execute("SELECT COUNT(*) FROM tts_cache").fetchone()[0]
        conn.execute("DELETE FROM tts_cache")
        conn.commit()
        return count

    def stats(self) -> dict:
        conn = self._get_conn()
        row = conn.execute(
            "SELECT COUNT(*), COALESCE(SUM(size_bytes), 0), COALESCE(SUM(hit_count), 0) FROM tts_cache"
        ).fetchone()
        return {
            "entries": row[0],
            "total_size_mb": round(row[1] / (1024 * 1024), 2),
            "total_hits": row[2],
        }
