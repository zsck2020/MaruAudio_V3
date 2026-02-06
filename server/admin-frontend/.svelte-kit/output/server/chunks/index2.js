import axios from "axios";
import { g as goto } from "./client.js";
const ERROR_MESSAGES = {
  // 认证相关
  4001: "登录已过期，请重新登录",
  4002: "未授权访问",
  4003: "签名验证失败",
  // 参数相关
  1001: "参数错误",
  1002: "缺少必要参数",
  1003: "参数格式不正确",
  // 用户相关
  2001: "用户不存在",
  2002: "密码错误",
  2003: "账号已禁用",
  2004: "用户已存在",
  // 卡密相关
  3001: "卡密无效",
  3002: "卡密已使用",
  3003: "卡密已过期",
  // 请求频率
  4029: "请求过于频繁，请稍后再试",
  // 服务器错误
  5e3: "服务器配置错误",
  5001: "服务器内部错误",
  5002: "邮件发送失败",
  5003: "数据库操作失败",
  // 网络错误
  "NETWORK_ERROR": "网络连接失败，请检查网络设置",
  "TIMEOUT_ERROR": "请求超时，请稍后重试",
  "UNKNOWN_ERROR": "未知错误，请联系管理员"
};
function getErrorMessage(error) {
  if (typeof error === "string") {
    return error;
  }
  if (error instanceof Error) {
    if (error.message.includes("Network Error") || error.message.includes("Failed to fetch")) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (error.message.includes("timeout")) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }
  if (error && typeof error === "object") {
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }
    if (error.message) {
      return error.message;
    }
  }
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}
let messageQueue = [];
function showMessage(type, message, duration = 3e3) {
  const id = Date.now();
  const msg = { id, type, message, duration };
  messageQueue.push(msg);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("show-message", { detail: msg }));
  }
  setTimeout(() => {
    messageQueue = messageQueue.filter((m) => m.id !== id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("hide-message", { detail: { id } }));
    }
  }, duration);
}
function showError(error, options = {}) {
  const message = getErrorMessage(error);
  const duration = options.duration || 3e3;
  options.showStackTrace || false;
  showMessage("error", message, duration);
}
function showSuccess(message, duration = 2e3) {
  showMessage("success", message, duration);
}
const api = axios.create({
  baseURL: "/api",
  timeout: 1e4,
  headers: {
    "Content-Type": "application/json"
  }
});
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("admin_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);
api.interceptors.response.use(
  (response) => {
    const res = response.data;
    if (res.code !== 0) {
      showError(res);
      if (res.code === 4001) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("admin_token");
          goto();
        }
      }
      return Promise.reject(new Error(res.message || getErrorMessage(res)));
    }
    return res;
  },
  (error) => {
    showError(error);
    return Promise.reject(error);
  }
);
const adminLogin = (data) => api.post("/admin/login", data);
const getUsers = (params) => api.get("/admin/users", { params });
const updateUser = (data) => api.post("/admin/users", data);
const resetUserPassword = (data) => api.post("/admin/users/reset-password", data);
const toggleUserStatus = (userId) => api.post("/admin/users/toggle-status", { user_id: userId });
const getUserLogs = (userId) => api.get("/admin/users/logs", { params: { user_id: userId } });
const getUserInvites = (userId) => api.get("/admin/users/invites", { params: { user_id: userId } });
const getUserCommissions = (userId) => api.get("/admin/users/commissions", { params: { user_id: userId } });
const getUserMachines = (userId) => api.get("/admin/users/machines", { params: { user_id: userId } });
const unbindUserMachine = (data) => api.post("/admin/users/machines/unbind", data);
const bindUserMachine = (data) => api.post("/admin/users/machines/bind", data);
const verifyUserMachine = (data) => api.post("/admin/users/machines/verify", data);
const exportUsers = () => api.get("/admin/users/export");
const getOperationLogs = (params) => api.get("/admin/logs", { params });
const getAnnouncements = () => api.get("/admin/announcements");
const saveAnnouncement = (data) => api.post("/admin/announcements", data);
const getCards = (params) => api.get("/admin/cards", { params });
const generateCards = (data) => api.post("/admin/cards/generate", data);
const updateSettings = (data) => api.post("/admin/settings", data);
const updateAdminProfile = (data) => api.post("/admin/profile", data);
export {
  generateCards as a,
  getCards as b,
  getOperationLogs as c,
  updateAdminProfile as d,
  getUserMachines as e,
  getUserInvites as f,
  getAnnouncements as g,
  getUserCommissions as h,
  getUserLogs as i,
  unbindUserMachine as j,
  exportUsers as k,
  updateUser as l,
  bindUserMachine as m,
  getUsers as n,
  showError as o,
  adminLogin as p,
  showSuccess as q,
  resetUserPassword as r,
  saveAnnouncement as s,
  toggleUserStatus as t,
  updateSettings as u,
  verifyUserMachine as v
};
