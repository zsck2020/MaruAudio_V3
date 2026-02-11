import axios from 'axios';
import { goto } from '$app/navigation';
import { showError, getErrorMessage } from '../utils/errorHandler';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器
api.interceptors.request.use(
  config => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('admin_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  error => Promise.reject(error)
);

// 响应拦截器 - 统一错误处理
api.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.code !== 0) {
      // 使用统一错误处理工具
      showError(res);
      if (res.code === 4001) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
          goto('/login');
        }
      }
      return Promise.reject(new Error(res.message || getErrorMessage(res)));
    }
    return res;
  },
  error => {
    // 网络错误或其他错误
    showError(error);
    return Promise.reject(error);
  }
);

// 管理后台登录（第一步）
export const adminLogin = (data) => api.post('/admin/login', data);

// 管理后台验证（第二步）
export const adminVerify = (data) => api.post('/admin/verify', data);

// 获取统计数据
export const getStats = () => api.get('/admin/stats');

// 获取用户列表
export const getUsers = (params) => api.get('/admin/users', { params });

// 更新用户
export const updateUser = (data) => api.post('/admin/users', data);

// 管理员重置用户密码
export const resetUserPassword = (data) => api.post('/admin/users/reset-password', data);

// 封禁/解封用户
export const toggleUserStatus = (userId) => api.post('/admin/users/toggle-status', { user_id: userId });

// 获取用户登录日志
export const getUserLogs = (userId) => api.get('/admin/users/logs', { params: { user_id: userId } });

// 获取用户邀请记录
export const getUserInvites = (userId) => api.get('/admin/users/invites', { params: { user_id: userId } });

// 获取用户佣金记录
export const getUserCommissions = (userId) => api.get('/admin/users/commissions', { params: { user_id: userId } });

// 获取用户机器码绑定列表
export const getUserMachines = (userId) => api.get('/admin/users/machines', { params: { user_id: userId } });

// 解绑用户机器码
export const unbindUserMachine = (data) => api.post('/admin/users/machines/unbind', data);

// 绑定用户机器码
export const bindUserMachine = (data) => api.post('/admin/users/machines/bind', data);

// 验证机器码归属
export const verifyUserMachine = (data) => api.post('/admin/users/machines/verify', data);

// 导出用户数据
export const exportUsers = () => api.get('/admin/users/export');

// 导出卡密数据
export const exportCards = () => api.get('/admin/cards/export');

// 获取操作日志
export const getOperationLogs = (params) => api.get('/admin/logs', { params });

// 获取公告列表
export const getAnnouncements = () => api.get('/admin/announcements');

// 保存公告
export const saveAnnouncement = (data) => api.post('/admin/announcements', data);

// 删除公告
export const deleteAnnouncement = (id) => api.post('/admin/announcements/delete', { id });

// 获取版本历史
export const getVersionHistory = (productCode) => api.get('/admin/versions', { params: { product_code: productCode } });

// 发布新版本
export const publishVersion = (data) => api.post('/admin/versions/publish', data);

// 获取备份列表
export const getBackupList = () => api.get('/admin/backups');

// 创建备份
export const createBackup = () => api.post('/admin/backups/create');

// 清理日志
export const cleanupLogs = (days) => api.post('/admin/logs/cleanup', { days });

// 获取卡密列表
export const getCards = (params) => api.get('/admin/cards', { params });

// 生成卡密
export const generateCards = (data) => api.post('/admin/cards/generate', data);

// 禁用卡密
export const disableCard = (cardId) => api.post('/admin/cards/disable', { card_id: cardId });

// 删除卡密
export const deleteCard = (cardId) => api.post('/admin/cards/delete', { card_id: cardId });

// 获取系统设置
export const getSettings = () => api.get('/admin/settings');

// 获取提现申请列表
export const getWithdrawals = (params) => api.get('/admin/withdrawals', { params });

// 处理提现申请
export const processWithdrawal = (data) => api.post('/admin/withdrawals/process', data);

// 更新系统设置
export const updateSettings = (data) => api.post('/admin/settings', data);

// 更新管理员信息
export const updateAdminProfile = (data) => api.post('/admin/profile', data);

// 测试邮件发送
export const testMail = (data) => api.post('/admin/test-mail', data);

// 测试 DashScope API Key
export const testDashScopeApi = (data) => api.post('/admin/test-dashscope', data);

// 上传文件
export const uploadFile = (formData) => api.post('/admin/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export default api;
