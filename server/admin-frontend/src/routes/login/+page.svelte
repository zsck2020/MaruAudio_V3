<script>
  import { goto } from '$app/navigation';
  import { adminLogin } from '$lib/api';
  import { showSuccess, showError } from '$lib/utils/errorHandler';
  import Input from '$lib/components/Input.svelte';
  import Button from '$lib/components/Button.svelte';
  
  let username = '';
  let password = '';
  let loading = false;
  
  async function handleLogin() {
    if (!username || !password) {
      showError('请输入管理员账号和密码');
      return;
    }
    
    loading = true;
    try {
      const res = await adminLogin({ username, password });
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('admin_token', res.data.token);
        localStorage.setItem('admin_info', JSON.stringify(res.data));
      }
      
      showSuccess('登录成功');
      goto('/dashboard');
    } catch (e) {
      // 错误已在拦截器处理
    } finally {
      loading = false;
    }
  }
  
  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      handleLogin();
    }
  }
</script>

<div class="login-container">
  <div class="login-card">
    <div class="login-title">
      <div class="login-logo">
        <span class="logo-icon">MA</span>
        <h1>丸子智能</h1>
      </div>
      <p>多产品管理平台</p>
    </div>
    
    <div class="login-form">
      <div class="form-item">
        <Input
          bind:value={username}
          placeholder="管理员账号"
          size="large"
          onkeypress={handleKeyPress}
        />
      </div>
      <div class="form-item">
        <Input
          bind:value={password}
          type="password"
          placeholder="密码"
          size="large"
          showPassword={true}
          onkeypress={handleKeyPress}
        />
      </div>
      <div class="form-item">
        <Button type="primary" size="large" {loading} onClick={handleLogin}>
          登录
        </Button>
      </div>
    </div>
  </div>
</div>

<style>
  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #1890ff 0%, #722ed1 100%);
    position: relative;
  }
  
  .login-container::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
  
  .login-card {
    width: 400px;
    padding: 40px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
    position: relative;
    z-index: 1;
  }
  
  .login-title {
    text-align: center;
    margin-bottom: 30px;
  }
  
  .login-logo {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 8px;
  }
  
  .logo-icon {
    font-size: 32px;
  }
  
  .login-title h1 {
    font-size: 24px;
    margin: 0;
    color: rgba(0, 0, 0, 0.85);
  }
  
  .login-title p {
    font-size: 14px;
    color: rgba(0, 0, 0, 0.65);
    margin: 0;
  }
  
  .login-form {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  
  .form-item {
    width: 100%;
  }
  
  @media (max-width: 768px) {
    .login-card {
      width: 90%;
      max-width: 400px;
      padding: 24px;
    }
    
    .login-title h1 {
      font-size: 20px;
    }
  }
</style>
