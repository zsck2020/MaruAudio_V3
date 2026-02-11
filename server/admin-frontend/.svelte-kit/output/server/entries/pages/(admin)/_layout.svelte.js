import { _ as attr_class, Z as ensure_array_like, a1 as attr, a2 as store_set, a3 as store_get, a4 as unsubscribe_stores } from "../../../chunks/index2.js";
import { a as ssr_context, e as escape_html } from "../../../chunks/context.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../../chunks/exports.js";
import "../../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../../chunks/state.svelte.js";
import { w as writable } from "../../../chunks/index.js";
import { S as Select } from "../../../chunks/Select.js";
/* empty css                                                   */
import { l as logger } from "../../../chunks/logger.js";
import "../../../chunks/index3.js";
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
const currentProduct = writable("dubbing");
function getWebSocketUrl() {
  if (typeof window !== "undefined" && window.WEBSOCKET_URL) {
    return window.WEBSOCKET_URL;
  }
  const protocol = typeof window !== "undefined" && window.location.protocol === "https:" ? "wss:" : "ws:";
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  const port = "8080";
  return `${protocol}//${host}:${port}`;
}
class AdminWebSocket {
  constructor(url = null) {
    this.url = url || getWebSocketUrl();
    this.ws = null;
    this.connected = false;
    this.authenticated = false;
    this.token = null;
    this.callbacks = {};
    this.autoReconnect = true;
    this.reconnectInterval = 5e3;
    this.reconnectTimer = null;
    this.heartbeatInterval = 3e4;
    this.heartbeatTimer = null;
  }
  /**
   * 连接 WebSocket 服务器
   */
  connect(token) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve(true);
    }
    this.token = token;
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.onopen = () => {
          this.connected = true;
          logger.log("[WebSocket] 已连接");
          this._emit("connected");
          if (this.token) {
            this.send({
              type: "auth",
              token: this.token,
              client_type: "admin"
            });
          }
          this._startHeartbeat();
          resolve(true);
        };
        this.ws.onmessage = (event) => {
          this._handleMessage(event.data);
        };
        this.ws.onerror = (error) => {
          logger.error("[WebSocket] 错误:", error);
          this._emit("error", error);
          reject(error);
        };
        this.ws.onclose = (event) => {
          this.connected = false;
          this.authenticated = false;
          logger.log("[WebSocket] 已断开:", event.code, event.reason);
          this._emit("disconnected", { code: event.code, reason: event.reason });
          this._stopHeartbeat();
          if (this.autoReconnect) {
            this._startReconnect();
          }
        };
      } catch (error) {
        reject(error);
      }
    });
  }
  /**
   * 断开连接
   */
  disconnect() {
    this.autoReconnect = false;
    this._stopReconnect();
    this._stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
    this.authenticated = false;
  }
  /**
   * 发送消息
   */
  send(data) {
    if (!this.connected || !this.ws) {
      return false;
    }
    try {
      this.ws.send(JSON.stringify(data));
      return true;
    } catch (error) {
      logger.error("[WebSocket] 发送失败:", error);
      return false;
    }
  }
  /**
   * 注册事件回调
   */
  on(event, callback) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }
    this.callbacks[event].push(callback);
  }
  /**
   * 移除事件回调
   */
  off(event, callback = null) {
    if (this.callbacks[event]) {
      if (callback) {
        this.callbacks[event] = this.callbacks[event].filter((cb) => cb !== callback);
      } else {
        this.callbacks[event] = [];
      }
    }
  }
  /**
   * 触发事件
   */
  _emit(event, data = null) {
    if (this.callbacks[event]) {
      this.callbacks[event].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          logger.error(`[WebSocket] 回调错误 [${event}]:`, error);
        }
      });
    }
  }
  /**
   * 处理消息
   */
  _handleMessage(message) {
    try {
      const data = JSON.parse(message);
      const msgType = data.type || "";
      logger.log("[WebSocket] 收到消息:", msgType);
      switch (msgType) {
        case "auth_success":
          this.authenticated = true;
          logger.log("[WebSocket] 认证成功");
          this._emit("authenticated", data);
          this.send({ type: "user_status_request" });
          break;
        case "auth_error":
          this.authenticated = false;
          logger.error("[WebSocket] 认证失败:", data.message);
          this._emit("auth_error", data);
          break;
        case "pong":
          break;
        case "user_online":
          this._emit("user_online", data);
          break;
        case "user_offline":
          this._emit("user_offline", data);
          break;
        case "user_status":
          this._emit("user_status", data);
          break;
        case "user_status_changed":
          this._emit("user_status_changed", data);
          break;
        default:
          this._emit(msgType, data);
          this._emit("message", data);
      }
    } catch (error) {
      logger.error("[WebSocket] 消息解析失败:", message);
    }
  }
  /**
   * 启动心跳
   */
  _startHeartbeat() {
    this._stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.connected) {
        this.send({ type: "ping" });
      }
    }, this.heartbeatInterval);
  }
  /**
   * 停止心跳
   */
  _stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  /**
   * 启动重连
   */
  _startReconnect() {
    this._stopReconnect();
    logger.log(`[WebSocket] 将在 ${this.reconnectInterval / 1e3} 秒后重连...`);
    this.reconnectTimer = setTimeout(() => {
      logger.log("[WebSocket] 尝试重连...");
      this.connect(this.token);
    }, this.reconnectInterval);
  }
  /**
   * 停止重连
   */
  _stopReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  /**
   * 广播消息给所有用户
   */
  broadcast(event, data) {
    return this.send({
      type: "admin_broadcast",
      payload: {
        type: event,
        data
      }
    });
  }
  /**
   * 请求在线用户状态
   */
  requestUserStatus() {
    return this.send({ type: "user_status_request" });
  }
}
const adminWs = new AdminWebSocket();
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { children } = $$props;
    let mobileMenuOpen = false;
    let adminInfo = {};
    let dropdownOpen = false;
    let currentPath = "";
    let currentTitle = "管理后台";
    let wsConnected = false;
    const menuItems = [
      { path: "/dashboard", icon: "DB", label: "控制台" },
      { path: "/users", icon: "U", label: "用户管理" },
      { path: "/cards", icon: "C", label: "卡密管理" },
      { path: "/character-packs", icon: "CP", label: "字符包管理" },
      { path: "/marketing", icon: "MK", label: "营销活动" },
      { path: "/commission", icon: "CM", label: "分佣提现" },
      { path: "/software", icon: "SW", label: "软件管理" },
      { path: "/announcements", icon: "AN", label: "公告管理" },
      { path: "/logs", icon: "LG", label: "操作日志" },
      { path: "/settings", icon: "ST", label: "系统设置" }
    ];
    onDestroy(() => {
      adminWs.disconnect();
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div${attr_class("layout-container svelte-we7dkw", void 0, { "mobile-menu-open": mobileMenuOpen })}>`);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> <aside${attr_class("layout-aside svelte-we7dkw", void 0, { "mobile-visible": mobileMenuOpen })}><div class="sidebar-logo svelte-we7dkw"><span class="logo-icon svelte-we7dkw">MA</span> <h2 class="svelte-we7dkw">丸子智能</h2></div> <nav class="sidebar-menu svelte-we7dkw"><!--[-->`);
      const each_array = ensure_array_like(menuItems);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let item = each_array[$$index];
        $$renderer3.push(`<a${attr("href", item.path)}${attr_class("menu-item svelte-we7dkw", void 0, { "active": currentPath === item.path })}><span class="menu-icon svelte-we7dkw">${escape_html(item.icon)}</span> <span class="menu-label svelte-we7dkw">${escape_html(item.label)}</span></a>`);
      }
      $$renderer3.push(`<!--]--></nav></aside> <div class="layout-main svelte-we7dkw"><header class="layout-header svelte-we7dkw"><div class="header-left svelte-we7dkw"><button class="mobile-menu-btn svelte-we7dkw" type="button"><span>☰</span></button> <span class="page-title-text svelte-we7dkw">${escape_html(currentTitle)}</span></div> <div class="header-right svelte-we7dkw"><div${attr_class("ws-status svelte-we7dkw", void 0, { "connected": wsConnected })}${attr("title", "WebSocket未连接")}><span class="ws-dot svelte-we7dkw"></span></div> <div class="product-selector-wrapper svelte-we7dkw">`);
      Select($$renderer3, {
        options: [
          { value: "dubbing", label: "丸子配音" },
          { value: "comic", label: "丸子漫剧" }
        ],
        get value() {
          return store_get($$store_subs ??= {}, "$currentProduct", currentProduct);
        },
        set value($$value) {
          store_set(currentProduct, $$value);
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div> <div class="user-dropdown-wrapper svelte-we7dkw"><button type="button" class="user-dropdown svelte-we7dkw" aria-haspopup="menu"${attr("aria-expanded", dropdownOpen)}><div class="user-avatar svelte-we7dkw">${escape_html(adminInfo?.username?.charAt(0)?.toUpperCase() || "A")}</div> <span class="username svelte-we7dkw">${escape_html(adminInfo?.username || "管理员")}</span> <span class="dropdown-arrow svelte-we7dkw">▼</span></button> `);
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></div></div></header> <main class="layout-content svelte-we7dkw">`);
      if (children) {
        $$renderer3.push("<!--[-->");
        children($$renderer3);
        $$renderer3.push(`<!---->`);
      } else {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--></main></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
