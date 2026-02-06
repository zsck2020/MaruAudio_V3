import { browser } from '$app/environment';
import { redirect } from '@sveltejs/kit';

// Token验证缓存（避免频繁验证）
let tokenValidationCache = {
  isValid: false,
  timestamp: 0,
  cacheDuration: 5 * 60 * 1000 // 5分钟缓存
};

/**
 * 验证token有效性
 */
async function validateToken(token) {
  // 检查缓存
  const now = Date.now();
  if (tokenValidationCache.isValid && (now - tokenValidationCache.timestamp) < tokenValidationCache.cacheDuration) {
    return true;
  }
  
  try {
    // 使用轻量级API验证token
    const response = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      tokenValidationCache.isValid = true;
      tokenValidationCache.timestamp = now;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token验证失败:', error);
    return false;
  }
}

export async function load({ url, route }) {
  if (!browser) {
    return {};
  }
  
  const token = localStorage.getItem('admin_token');
  const isLoginPage = route.id === '/login';
  
  // 如果访问登录页且已有token，验证token有效性
  if (isLoginPage && token) {
    const isValid = await validateToken(token);
    if (isValid) {
      throw redirect(302, '/dashboard');
    } else {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
    }
  }
  
  // 需要登录的页面
  if (!isLoginPage && !token) {
    throw redirect(302, '/login');
  }
  
  if (!isLoginPage && token) {
    // 验证token有效性
    const isValid = await validateToken(token);
    if (!isValid) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      throw redirect(302, '/login');
    }
  }
  
  return {};
}



// Token验证缓存（避免频繁验证）
let tokenValidationCache = {
  isValid: false,
  timestamp: 0,
  cacheDuration: 5 * 60 * 1000 // 5分钟缓存
};

/**
 * 验证token有效性
 */
async function validateToken(token) {
  // 检查缓存
  const now = Date.now();
  if (tokenValidationCache.isValid && (now - tokenValidationCache.timestamp) < tokenValidationCache.cacheDuration) {
    return true;
  }
  
  try {
    // 使用轻量级API验证token
    const response = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.status === 200) {
      tokenValidationCache.isValid = true;
      tokenValidationCache.timestamp = now;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token验证失败:', error);
    return false;
  }
}

export async function load({ url, route }) {
  if (!browser) {
    return {};
  }
  
  const token = localStorage.getItem('admin_token');
  const isLoginPage = route.id === '/login';
  
  // 如果访问登录页且已有token，验证token有效性
  if (isLoginPage && token) {
    const isValid = await validateToken(token);
    if (isValid) {
      throw redirect(302, '/dashboard');
    } else {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
    }
  }
  
  // 需要登录的页面
  if (!isLoginPage && !token) {
    throw redirect(302, '/login');
  }
  
  if (!isLoginPage && token) {
    // 验证token有效性
    const isValid = await validateToken(token);
    if (!isValid) {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_info');
      throw redirect(302, '/login');
    }
  }
  
  return {};
}

