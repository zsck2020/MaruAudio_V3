"""TTS 引擎管理 — 懒加载、缓存、生命周期

支持三类引擎:
- lightweight (v1.5): 本地轻量推理
- emotion (v2.0): 本地情感推理
- cloud: 云端推理（仙宫云上自部署的 IndexTTS 2.0 远程实例）
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


def _env_bool(key: str, default: bool = False) -> bool:
    val = os.environ.get(key, "").lower()
    if val in ("1", "true", "yes"):
        return True
    if val in ("0", "false", "no"):
        return False
    return default


class EngineManager:
    """管理两个 IndexTTS 引擎实例的生命周期

    加速开关通过环境变量控制：
        MARUAUDIO_FP16=1           — v1.5/v2.0 半精度推理
        MARUAUDIO_CUDA_KERNEL=1    — BigVGAN 融合 CUDA kernel
        MARUAUDIO_DEEPSPEED=1      — v2.0 DeepSpeed KV cache
        MARUAUDIO_ACCEL=1          — v2.0 AccelEngine (CUDA Graph)
        MARUAUDIO_TORCH_COMPILE=1  — v2.0 S2Mel torch.compile
    """

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
                self._v15 = IndexTTS(
                    cfg_path=cfg_path,
                    model_dir=model_dir,
                    is_fp16=_env_bool("MARUAUDIO_FP16"),
                    use_cuda_kernel=_env_bool("MARUAUDIO_CUDA_KERNEL") or None,
                )
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
                self._v20 = IndexTTS2(
                    cfg_path=cfg_path,
                    model_dir=model_dir,
                    use_fp16=_env_bool("MARUAUDIO_FP16"),
                    use_cuda_kernel=_env_bool("MARUAUDIO_CUDA_KERNEL") or None,
                    use_deepspeed=_env_bool("MARUAUDIO_DEEPSPEED"),
                    use_accel=_env_bool("MARUAUDIO_ACCEL"),
                    use_torch_compile=_env_bool("MARUAUDIO_TORCH_COMPILE"),
                )
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
        """检查云端引擎可用性（同步包装异步检查）"""
        import asyncio

        from . import cloud_engine

        if not cloud_engine.is_configured():
            return {
                "engine": "cloud",
                "available": False,
                "message": "未配置远程实例端点（XIANGONG_TTS_BASE）",
            }

        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    future = pool.submit(asyncio.run, cloud_engine.check_availability())
                    return future.result(timeout=6)
        except (RuntimeError, Exception):
            pass

        try:
            return asyncio.run(cloud_engine.check_availability())  # type: ignore[arg-type]
        except Exception as e:
            return {
                "engine": "cloud",
                "available": False,
                "message": f"云端检测失败：{e}",
            }
