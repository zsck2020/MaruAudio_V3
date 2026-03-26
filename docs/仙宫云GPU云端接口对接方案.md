# 仙宫云 GPU 云端接口对接方案

> 平台: https://www.xiangongyun.com  
> API Playground: https://api-playground.xiangongyun.com  
> 最后更新: 2026-03-18

---

## 一、方案概述

通过仙宫云 API 实现 GPU 实例的弹性管理，在实例上部署 IndexTTS 引擎，实现：
- 用户配音时自动开机
- 空闲时自动关机停止计费
- 按分钟计费，成本极低

### 架构

```
用户（丸子配音桌面端）
    ↓ Tauri IPC
Rust 层 (reqwest)
    ↓ HTTP
丸子配音后端 (auth.wzagent.cn)
    ├── 验证 Token + 检查字符余额
    ├── 扣除字符数
    ├── 检查 GPU 实例状态 → 关机则调 boot 开机
    ├── 转发合成请求到 GPU 实例上的 IndexTTS API
    ├── 空闲超时 → 调 shutdown_release_gpu 关机
    └── 返回音频数据
```

---

## 二、仙宫云 API 端点清单

### 2.1 实例 API

| 方法 | 端点 | 功能 |
|------|------|------|
| `GET` | `/open/instances` | 查询所有实例列表 |
| `GET` | `/open/instance/{id}` | 查询单个实例详情 |
| `GET` | `/open/instance/{id}/images` | 查询实例关联的镜像 |
| `POST` | `/open/instance/deploy` | 创建并部署新实例 |
| `POST` | `/open/instance/destroy` | 销毁实例 |
| `POST` | `/open/instance/shutdown` | 关机（保留数据和 GPU 绑定） |
| `POST` | `/open/instance/shutdown_release_gpu` | 关机并释放 GPU（停止计费） |
| `POST` | `/open/instance/shutdown_destroy` | 关机并销毁实例 |
| `POST` | `/open/instance/boot` | 开机 |
| `POST` | `/open/instance/saveimage` | 将当前实例保存为私有镜像 |
| `POST` | `/open/instance/saveimage_destroy` | 保存镜像后销毁实例 |

### 2.2 私有镜像 API

| 方法 | 端点 | 功能 |
|------|------|------|
| `GET` | `/open/images` | 查询私有镜像列表 |
| `GET` | `/open/image/{id}` | 查询单个镜像详情 |

### 2.3 鉴权方式

Headers 中需携带 API Token（在仙宫云控制台生成）。

---

## 三、丸子配音核心对接接口

### 3.1 开机

```
POST /open/instance/boot
```

用途：用户发起配音请求时，如果 GPU 实例处于关机状态，调用此接口启动实例。

### 3.2 关机释放 GPU

```
POST /open/instance/shutdown_release_gpu
```

用途：空闲超时（建议 10 分钟无请求）后调用，释放 GPU 停止计费。

### 3.3 查询实例状态

```
GET /open/instance/{id}
```

用途：检查实例是否运行中，判断是否需要开机。

### 3.4 查询实例列表

```
GET /open/instances
```

用途：获取所有实例，找到 IndexTTS 实例的 ID 和状态。

---

## 四、GPU 实例价格

| GPU | 价格 | 显存 |
|-----|------|------|
| RTX 4090 | ~¥1.89/小时（按分钟计费） | 24GB |

---

## 五、IndexTTS 部署流程

### 5.1 首次部署

1. 在仙宫云控制台创建 RTX 4090 实例（或通过 API `POST /open/instance/deploy`）
2. SSH 登录实例
3. 安装 IndexTTS 2.0 环境：

```bash
apt update && apt install -y git git-lfs
git clone https://github.com/index-tts/index-tts.git
cd index-tts
pip install -U uv
uv sync --extra webui
```

4. 下载模型（从 ModelScope 加速）：

```bash
uv tool install modelscope
modelscope download --model IndexTeam/IndexTTS-2 --local_dir checkpoints
```

5. 配置开机自启脚本 `/root/start_indextts.sh`：

```bash
#!/bin/bash
cd /root/index-tts
nohup uv run webui.py --server-name 0.0.0.0 --server-port 7860 &
```

6. 设置开机自启（rc.local 或 systemd）：

```bash
chmod +x /root/start_indextts.sh
echo "/root/start_indextts.sh" >> /etc/rc.local
```

7. 验证 IndexTTS WebUI 可通过公网访问
8. 保存为私有镜像：`POST /open/instance/saveimage`

### 5.2 日常开机

调用 `POST /open/instance/boot` 后，实例自动从私有镜像启动，开机脚本自动运行 IndexTTS。

---

## 六、后端对接逻辑

### 6.1 配音请求处理流程

```
收到用户配音请求
    ↓
1. 验证用户 Token
2. 检查字符余额 ≥ 文本字数
3. GET /open/instance/{id} → 检查实例状态
    ├── "running" → 跳到步骤 5
    └── "stopped" → 继续步骤 4
4. POST /open/instance/boot → 开机
    ↓ 轮询实例状态，等待变为 "running"（预计 1-3 分钟）
    ↓ 通过 WebSocket 通知前端 "正在启动引擎..."
5. 预扣费
6. 转发请求到 GPU 实例上的 IndexTTS API
    POST http://{instance_ip}:7860/api/tts
    Body: { text, audio_prompt, emotion_params... }
7. 接收音频结果
8. 确认扣费
9. 返回音频给客户端
```

### 6.2 空闲关机逻辑

```
后端维护一个 "最后请求时间" 记录
定时任务（每分钟检查一次）:
    if 当前时间 - 最后请求时间 > 10分钟:
        POST /open/instance/shutdown_release_gpu
        记录状态为 "已关机"
```

### 6.3 冷启动等待

开机到 IndexTTS 就绪预计 1-3 分钟。后端应：
1. 调用 boot 后立即返回"引擎启动中"状态
2. 通过 WebSocket 推送启动进度
3. IndexTTS 就绪后自动处理排队的请求

---

## 七、后端需要存储的配置

| 配置项 | 说明 |
|--------|------|
| `XGC_API_TOKEN` | 仙宫云 API Token |
| `XGC_API_BASE` | `https://api.xiangongyun.com`（待确认） |
| `XGC_INSTANCE_ID` | IndexTTS GPU 实例 ID |
| `XGC_INSTANCE_IP` | 实例公网 IP |
| `XGC_INDEXTTS_PORT` | IndexTTS API 端口（默认 7860） |
| `XGC_IDLE_TIMEOUT` | 空闲关机超时时间（分钟，默认 10） |
| `XGC_IMAGE_ID` | IndexTTS 私有镜像 ID |

---

## 八、成本估算

| 场景 | GPU 运行时长 | 成本 |
|------|------------|------|
| 生成 1 分钟音频 | ~1 分钟（含处理） | ~¥0.03 |
| 生成 10 分钟音频 | ~5 分钟 | ~¥0.16 |
| 开机等待 + 生成 | ~5 分钟 | ~¥0.16 |
| 挂机 1 小时（忘记关） | 60 分钟 | ~¥1.89 |

与云端 API 对比（100 万字）：

| 方案 | 成本 |
|------|------|
| 仙宫云 GPU（自部署 IndexTTS） | **~¥50-100**（取决于使用时长） |
| 硅基流动 API | ~¥150 |
| 云声配音 API | ~¥300 |
| fal.ai API | ~¥3,500 |

---

## 九、风险与缓解

| 风险 | 级别 | 缓解 |
|------|:---:|------|
| 冷启动延迟 1-3 分钟 | 中 | 前端显示"引擎启动中"进度条 |
| GPU 被其他用户抢占 | 中 | 保持关机而非销毁，GPU 绑定不释放（用 shutdown 而非 shutdown_release_gpu） |
| 实例 IP 变化 | 低 | 每次开机后重新查询 instance 获取 IP |
| API Token 泄露 | 低 | Token 仅存后端 |
| 忘记关机导致持续计费 | 中 | 定时任务强制检查空闲关机 |

---

## 十、关机策略选择

| 接口 | 效果 | 适用场景 |
|------|------|---------|
| `shutdown` | 关机，保留 GPU 绑定 | 短暂休息，1 小时内会再用 |
| `shutdown_release_gpu` | 关机，释放 GPU，停止计费 | 空闲超时，不确定何时再用 |
| `shutdown_destroy` | 关机并销毁实例 | 不再使用 |

**建议策略**：
- 空闲 10 分钟 → `shutdown_release_gpu`（释放 GPU 停止计费）
- 再次使用时 → `boot`（重新分配 GPU 开机）
- 如果频繁使用（日活跃用户多）→ 用 `shutdown` 保留 GPU 绑定，减少冷启动

---

## 十一、待确认事项

| 事项 | 说明 |
|------|------|
| API Base URL | 需确认是 `https://api.xiangongyun.com` 还是其他 |
| 鉴权方式 | 需在 Playground Headers 中查看 Token 格式 |
| boot/shutdown 参数 | 需在 Playground Body 中查看请求体格式 |
| 开机后 IP 是否变化 | 需实际测试 |
| 开机自启脚本 | 需确认自定义镜像是否支持 rc.local 或 systemd |
| 公网端口映射 | 需确认实例的 7860 端口是否自动映射公网 |
