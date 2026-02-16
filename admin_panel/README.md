# 丸子配音 管理后台

## 📋 概述

本目录包含丸子配音项目的完整管理后台系统，从 V2 项目迁移而来，**保持完全不变**，继续使用。

## 🏗️ 目录结构

```
server/
├── admin-frontend/     # 管理后台前端 (Vue 3 + Element Plus)
│   ├── src/           # 源代码
│   ├── dist/          # 构建产物
│   └── package.json   # 前端依赖
├── api/               # 管理后台 API (PHP)
│   ├── config/        # 配置文件
│   │   ├── database.php    # 数据库配置 ⚠️
│   │   ├── app.php         # 应用配置
│   │   └── mail.php        # 邮件配置
│   ├── controllers/   # 控制器
│   ├── lib/           # 核心库
│   └── index.php      # API 入口
└── websocket/         # WebSocket 服务 (PHP)
    ├── src/           # 源代码
    └── server.php     # WebSocket 服务器入口
```

## ⚙️ 配置说明

### 数据库配置

**位置**: `api/config/database.php`

**当前配置**:
- 主机: `localhost`
- 端口: `3306`
- 数据库: `maruaudio`
- 用户名: `MaruAudio`
- 密码: `6FS64ybEGeyMcpZs`

⚠️ **重要**: 数据库配置保持不变，确保与现有数据库连接正常。

### API 配置

**位置**: `api/config/app.php`

包含应用基础配置，如 JWT 密钥、API 地址等。

### 邮件配置

**位置**: `api/config/mail.php`

包含邮件服务配置（用于发送验证码、通知等）。

## 🚀 部署说明

### 1. 管理后台前端

```bash
cd server/admin-frontend
npm install
npm run build
```

构建产物在 `dist/` 目录，需要部署到 Web 服务器。

### 2. API 后端

- 需要 PHP 7.4+ 环境
- 配置 Web 服务器（Nginx/Apache）指向 `api/index.php`
- 确保数据库连接正常

### 3. WebSocket 服务

```bash
cd server/websocket
composer install
php server.php
```

或使用提供的启动脚本：
```bash
./start.sh
```

## 📡 API 接口

API 入口: `api/index.php`

主要接口包括：
- 用户认证: `/api/auth/*`
- 用户管理: `/api/user/*`
- 管理后台: `/api/admin/*`
- 角色包: `/api/character-pack/*`
- 配置: `/api/config/*`

详细 API 文档请参考: `api/API_DOCS.md`

## 🔐 安全说明

1. **数据库密码**: 已包含在配置文件中，请确保服务器安全
2. **JWT 密钥**: 在 `api/config/app.php` 中配置
3. **API 签名**: 使用 HMAC-SHA256 签名验证
4. **请求频率限制**: 已实现基础限流保护

## 📝 注意事项

1. **保持不变**: 管理后台代码完全保持不变，继续使用
2. **数据库连接**: 确保数据库配置正确，避免用户数据丢失
3. **API 地址**: 客户端需要配置正确的 API 地址
4. **WebSocket**: 确保 WebSocket 服务正常运行，用于实时同步

## 🔄 与客户端对接

V3 客户端（Tauri + Vue 3）需要：

1. **配置 API 地址**: 指向 `server/api/index.php`
2. **配置 WebSocket 地址**: 指向 `server/websocket/server.php`
3. **保持 API 接口兼容**: 使用相同的接口路径和参数格式
4. **保持认证机制**: 使用相同的 JWT Token 认证

## 📚 相关文档

- API 文档: `api/API_DOCS.md`
- 数据库结构: `api/database/schema.sql`
- V2 项目分析: `../项目开发文档/V2项目功能分析报告.md`

---

**最后更新**: 2026年（从 V2 项目迁移）

