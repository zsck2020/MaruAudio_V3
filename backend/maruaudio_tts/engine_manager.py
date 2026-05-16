"""TTS 引擎管理 — 懒加载、缓存、生命周期

支持三类引擎:
- lightweight (v1.5): 本地轻量推理
- emotion (v2.0): 本地情感推理
- cloud: 云端推理（阿里云百炼 Qwen3-TTS）
"""

from __future__ import annotations

import os
import sys
import threading
from typing import Optional

# 将 IndexTTS 路径加入 sys.path
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_PROJECT_ROOT = os.path.dirname(_BACKEND_DIR)
_V15_DIR = os.path.join(_BACKEND_DIR, "..", "IndexTTS", "v15")
_V20_DIR = os.path.join(_BACKEND_DIR, "..", "IndexTTS", "v20")

# 模型权重存放目录（项目根目录/checkpoints/v15 和 checkpoints/v20）
_CHECKPOINTS_DIR = os.path.join(_PROJECT_ROOT, "checkpoints")
_V15_CKPT_DIR = os.path.join(_CHECKPOINTS_DIR, "v15")
_V20_CKPT_DIR = os.path.join(_CHECKPOINTS_DIR, "v20")


def _ensure_path(path: str) -> None:
    abs_path = os.path.abspath(path)
    if abs_path not in sys.path:
        sys.path.insert(0, abs_path)


class EngineManager:
    """管理两个 IndexTTS 引擎实例的生命周期"""

    def __init__(self) -> None:
        self._v15: Optional[object] = None
        self._v20: Optional[object] = None
        self._v15_device: Optional[str] = None
        self._v20_device: Optional[str] = None
        self._lock = threading.Lock()
        self._v15_loading = False
        self._v20_loading = False

    def get_v15(self):
        """获取或懒加载 IndexTTS v1.5 实例"""
        if self._v15 is not None:
            return self._v15
        with self._lock:
            if self._v15 is not None:
                return self._v15
            if self._v15_loading:
                return None
            self._v15_loading = True
            try:
                _ensure_path(_V15_DIR)
                from indextts import IndexTTS

                cfg_path = os.path.join(_V15_CKPT_DIR, "config.yaml")
                model_dir = _V15_CKPT_DIR
                self._v15 = IndexTTS(cfg_path=cfg_path, model_dir=model_dir)
                self._v15_device = str(getattr(self._v15, "device", "unknown"))
                return self._v15
            except Exception as e:
                print(f"[EngineManager] v1.5 加载失败: {e}")
                self._v15 = None
                return None
            finally:
                self._v15_loading = False

    def get_v20(self):
        """获取或懒加载 IndexTTS v2.0 实例"""
        if self._v20 is not None:
            return self._v20
        with self._lock:
            if self._v20 is not None:
                return self._v20
            if self._v20_loading:
                return None
            self._v20_loading = True
            try:
                _ensure_path(_V20_DIR)
                from indextts import IndexTTS2

                cfg_path = os.path.join(_V20_CKPT_DIR, "config.yaml")
                model_dir = _V20_CKPT_DIR
                self._v20 = IndexTTS2(cfg_path=cfg_path, model_dir=model_dir)
                self._v20_device = str(getattr(self._v20, "device", "unknown"))
                return self._v20
            except Exception as e:
                print(f"[EngineManager] v2.0 加载失败: {e}")
                self._v20 = None
                return None
            finally:
                self._v20_loading = False

    def check_v15(self) -> dict:
        """检查 v1.5 引擎可用性"""
        if self._v15 is not None:
            return {"engine": "lightweight", "available": True, "message": "已加载", "device": self._v15_device}
        if self._v15_loading:
            return {"engine": "lightweight", "available": False, "message": "加载中..."}
        # 尝试加载
        inst = self.get_v15()
        if inst is not None:
            return {"engine": "lightweight", "available": True, "message": "加载成功", "device": self._v15_device}
        # 检查 checkpoint 是否存在
        ckpt = os.path.join(_V15_CKPT_DIR, "config.yaml")
        if os.path.isfile(ckpt):
            return {"engine": "lightweight", "available": False, "message": "模型文件存在但加载失败"}
        return {"engine": "lightweight", "available": False, "message": "未找到模型文件"}

    def check_v20(self) -> dict:
        """检查 v2.0 引擎可用性"""
        if self._v20 is not None:
            return {"engine": "emotion", "available": True, "message": "已加载", "device": self._v20_device}
        if self._v20_loading:
            return {"engine": "emotion", "available": False, "message": "加载中..."}
        inst = self.get_v20()
        if inst is not None:
            return {"engine": "emotion", "available": True, "message": "加载成功", "device": self._v20_device}
        ckpt = os.path.join(_V20_CKPT_DIR, "config.yaml")
        if os.path.isfile(ckpt):
            return {"engine": "emotion", "available": False, "message": "模型文件存在但加载失败"}
        return {"engine": "emotion", "available": False, "message": "未找到模型文件"}

    def status(self) -> list[dict]:
        """返回所有引擎状态"""
        return [self.check_v15(), self.check_v20(), self.check_cloud()]

    def get_engine(self, engine: str):
        """根据名称获取引擎实例"""
        if engine == "lightweight":
            return self.get_v15()
        elif engine == "emotion":
            return self.get_v20()
        elif engine == "cloud":
            # 云端引擎不需要本地实例，返回特殊标记
            return "cloud"
        return None

    def check_cloud(self) -> dict:
        """检查云端引擎可用性"""
        from . import cloud_engine

        # 云端引擎始终返回状态，实际可用性由 API Key 决定
        api_key = os.environ.get("DASHSCOPE_API_KEY")
        if not api_key:
            return {
                "engine": "cloud",
                "available": False,
                "message": "未配置 API Key",
            }

        # 检查 dashscope SDK
        try:
            import dashscope  # noqa: F401
            return {
                "engine": "cloud",
                "available": True,
                "message": "云端引擎可用",
            }
        except ImportError:
            return {
                "engine": "cloud",
                "available": False,
                "message": "未安装 dashscope SDK",
            }
