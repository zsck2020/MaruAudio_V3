# 丸子配音 API 文档

## 基础信息

- **Base URL**: `https://175.178.131.67/api/`
- **请求格式**: JSON
- **响应格式**: JSON
- **认证方式**: Bearer Token (JWT)

## 响应格式

```json
{
  "code": 0,           // 0 表示成功，非 0 表示错误
  "message": "成功",   // 提示信息
  "data": {}           // 返回数据
}
```

---

## 公共接口（无需认证）

### 获取公共配置
```
GET /config
```

**响应**:
```json
{
  "registration_enabled": "1",
  "user_agreement": "...",
  "privacy_policy": "...",
  "support_qrcode_url": "...",
  "card_price_monthly": "29.9",
  "card_price_yearly": "199",
  "card_price_permanent": "399"
}
```

### 获取系统公告
```
GET /announcements
```

**响应**:
```json
{
  "list": [
    {
      "id": 1,
      "title": "公告标题",
      "content": "公告内容",
      "type": "info",
      "priority": 0
    }
  ]
}
```

---

## 认证接口

### 发送验证码
```
POST /auth/send-code
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| type | string | 是 | register/reset |

### 用户注册
```
POST /auth/register
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 |
| code | string | 是 | 验证码 |
| machine_code | string | 是 | 机器码 |
| invite_code | string | 否 | 邀请码 |

### 用户登录
```
POST /auth/login
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码 |
| machine_code | string | 是 | 机器码 |

**响应**:
```json
{
  "token": "eyJ...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "user_group": "monthly",
    "expire_time": "2026-02-15 10:00:00"
  }
}
```

### 重置密码
```
POST /auth/reset-password
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| code | string | 是 | 验证码 |
| new_password | string | 是 | 新密码 |

---

## 用户接口（需认证）

### 获取用户信息
```
GET /user/info
Headers: Authorization: Bearer <token>
```

### 激活卡密
```
POST /user/activate
Headers: Authorization: Bearer <token>
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| card_key | string | 是 | 卡密 |

### 获取邀请信息
```
GET /user/invite-info
Headers: Authorization: Bearer <token>
```

**响应**:
```json
{
  "invite_code": "ABC12345",
  "invite_count": 10,
  "commission_balance": 100.00,
  "withdrawn_total": 50.00
}
```

### 获取邀请记录
```
GET /user/invite-records
Headers: Authorization: Bearer <token>
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码，默认 1 |
| page_size | int | 否 | 每页数量，默认 20 |

### 申请提现
```
POST /user/withdraw
Headers: Authorization: Bearer <token>
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| amount | float | 是 | 提现金额 |
| account | string | 是 | 收款账号 |
| account_type | string | 否 | alipay/wechat/bank |

### 获取用户消息
```
GET /user/messages
Headers: Authorization: Bearer <token>
```

### 标记消息已读
```
POST /user/messages/read
Headers: Authorization: Bearer <token>
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| message_id | int | 否 | 消息ID，0表示全部 |

---

## 管理员接口

### 管理员登录
```
POST /admin/login
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

### 验证登录验证码
```
POST /admin/verify
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| admin_id | int | 是 | 管理员ID |
| code | string | 是 | 验证码 |

### 获取统计数据
```
GET /admin/stats
Headers: Authorization: Bearer <token>
```

### 获取用户列表
```
GET /admin/users
Headers: Authorization: Bearer <token>
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页数量 |
| keyword | string | 否 | 搜索关键词 |

### 获取卡密列表
```
GET /admin/cards
Headers: Authorization: Bearer <token>
```

### 生成卡密
```
POST /admin/cards/generate
Headers: Authorization: Bearer <token>
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| card_type | string | 是 | monthly/yearly/permanent |
| count | int | 是 | 生成数量 |

### 获取公告列表
```
GET /admin/announcements
Headers: Authorization: Bearer <token>
```

### 保存公告
```
POST /admin/announcements
Headers: Authorization: Bearer <token>
```

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | int | 否 | 公告ID，0表示新建 |
| title | string | 是 | 标题 |
| content | string | 是 | 内容 |
| type | string | 否 | info/warning/success/error |
| priority | int | 否 | 优先级 |
| is_active | bool | 否 | 是否启用 |

### 删除公告
```
POST /admin/announcements/delete
Headers: Authorization: Bearer <token>
```

### 获取操作日志
```
GET /admin/logs
Headers: Authorization: Bearer <token>
```

### 导出用户数据
```
GET /admin/users/export
Headers: Authorization: Bearer <token>
```

### 导出卡密数据
```
GET /admin/cards/export
Headers: Authorization: Bearer <token>
```

---

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 2001 | 用户不存在 |
| 2002 | 密码错误 |
| 2003 | 账号已禁用 |
| 3001 | 卡密无效 |
| 3002 | 卡密已使用 |
| 4001 | 未登录或Token过期 |
| 4029 | 请求过于频繁 |
| 5001 | 服务器错误 |
| 5002 | 邮件发送失败 |

---

## 请求频率限制

- 每个 IP 每分钟最多 120 次请求
- 超出限制返回错误码 4029

---

*文档更新时间: 2026-01-16*
