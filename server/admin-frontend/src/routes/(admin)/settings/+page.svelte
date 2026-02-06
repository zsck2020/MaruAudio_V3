<script>
  import { onMount } from 'svelte';
  import { getSettings, updateSettings, updateAdminProfile } from '$lib/api';
  import logger from '$lib/utils/logger';
  import Card from '$lib/components/Card.svelte';
  import Button from '$lib/components/Button.svelte';
  import Input from '$lib/components/Input.svelte';
  import Message from '$lib/components/Message';
  
  let domainForm = $state({
    api_domain: '',
    admin_domain: ''
  });
  
  let adminForm = $state({
    username: '',
    email: '',
    new_password: '',
    confirm_password: ''
  });
  
  let mailForm = $state({
    smtp_host: 'smtp.qq.com',
    smtp_port: 465,
    smtp_user: 'qilane@foxmail.com',
    smtp_pass: '',
    from_name: '丸子配音'
  });
  
  async function loadSettings() {
    // 加载管理员信息
    if (typeof window !== 'undefined') {
      const adminInfo = localStorage.getItem('admin_info');
      if (adminInfo) {
        const info = JSON.parse(adminInfo);
        adminForm.username = info.username || '';
        adminForm.email = info.email || '';
      }
    }
    
    // 从 API 加载系统设置
    try {
      const res = await getSettings();
      if (res.data) {
        // 域名设置
        domainForm.api_domain = res.data.api_domain || '';
        domainForm.admin_domain = res.data.admin_domain || '';
        // 邮件设置
        mailForm.smtp_host = res.data.smtp_host || 'smtp.qq.com';
        mailForm.smtp_port = parseInt(res.data.smtp_port) || 465;
        mailForm.smtp_user = res.data.smtp_user || '';
        mailForm.smtp_pass = res.data.smtp_pass || '';
        mailForm.from_name = res.data.from_name || '丸子配音';
      }
    } catch (e) {
      logger.error('加载设置失败', e);
    }
  }
  
  async function saveDomainSettings() {
    try {
      await updateSettings({
        api_domain: domainForm.api_domain,
        admin_domain: domainForm.admin_domain
      });
      Message.success('域名配置已保存');
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  async function testDomain() {
    if (!domainForm.api_domain) {
      Message.error('请先配置API域名');
      return;
    }
    try {
      const response = await fetch(`https://${domainForm.api_domain}/api/health`);
      if (response.ok) {
        Message.success('域名连接测试成功');
      } else {
        Message.error('域名连接失败，请检查配置');
      }
    } catch (e) {
      Message.error('域名连接失败: ' + e.message);
    }
  }
  
  async function saveAdminSettings() {
    if (adminForm.new_password && adminForm.new_password !== adminForm.confirm_password) {
      Message.error('两次输入的密码不一致');
      return;
    }
    try {
      await updateAdminProfile({
        email: adminForm.email,
        new_password: adminForm.new_password || undefined
      });
      Message.success('保存成功');
      adminForm.new_password = '';
      adminForm.confirm_password = '';
    } catch (e) {
      // 错误已在拦截器处理
    }
  }
  
  async function saveMailSettings() {
    try {
      await updateSettings({
        smtp_host: mailForm.smtp_host,
        smtp_port: String(mailForm.smtp_port),
        smtp_user: mailForm.smtp_user,
        smtp_pass: mailForm.smtp_pass,
        from_name: mailForm.from_name
      });
      Message.success('邮箱配置已保存');
    } catch (e) {
      Message.error('保存失败');
    }
  }
  
  async function testMail() {
    if (!mailForm.smtp_user) {
      Message.error('请先配置发件邮箱');
      return;
    }
    
    const testEmail = adminForm.email || mailForm.smtp_user;
    
    try {
      const response = await fetch('/api/admin/test-mail', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('admin_token') : ''}`
        },
        body: JSON.stringify({
          to: testEmail,
          smtp_host: mailForm.smtp_host,
          smtp_port: mailForm.smtp_port,
          smtp_user: mailForm.smtp_user,
          smtp_pass: mailForm.smtp_pass,
          from_name: mailForm.from_name
        })
      });
      
      const result = await response.json();
      if (result.code === 0) {
        Message.success(`测试邮件已发送到 ${testEmail}`);
      } else {
        Message.error(result.message || '发送失败');
      }
    } catch (e) {
      Message.error('发送失败: ' + e.message);
    }
  }
  
  onMount(() => {
    loadSettings();
  });
</script>

<div>
  <!-- 域名设置 -->
  <Card title="域名绑定" style="margin-bottom: 20px;">
    <div style="background: #fff7e6; border: 1px solid #ffe58f; border-radius: 4px; padding: 12px; margin-bottom: 16px;">
      <div style="font-weight: 500; margin-bottom: 8px;">域名绑定说明</div>
      <ol style="margin: 8px 0 0 0; padding-left: 20px; line-height: 1.8;">
        <li>先在域名服务商处将域名解析到服务器 IP: <code>175.178.131.67</code></li>
        <li>在宝塔面板添加站点并配置 SSL 证书</li>
        <li>配置 Nginx 反向代理指向对应目录</li>
        <li>最后在此处保存域名配置</li>
      </ol>
    </div>
    
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div>
        <label for="settings-api-domain" style="display: block; margin-bottom: 8px; font-weight: 500;">API 域名</label>
        <div style="display: flex; align-items: center;">
          <span style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #d9d9d9; border-right: none; border-radius: 4px 0 0 4px;">https://</span>
          <Input
            id="settings-api-domain"
            bind:value={domainForm.api_domain}
            placeholder="如: api.maruai.cn"
            style="flex: 1; border-radius: 0 4px 4px 0;"
          />
        </div>
      </div>
      
      <div>
        <label for="settings-admin-domain" style="display: block; margin-bottom: 8px; font-weight: 500;">管理后台域名</label>
        <div style="display: flex; align-items: center;">
          <span style="padding: 8px 12px; background: #f5f5f5; border: 1px solid #d9d9d9; border-right: none; border-radius: 4px 0 0 4px;">https://</span>
          <Input
            id="settings-admin-domain"
            bind:value={domainForm.admin_domain}
            placeholder="如: admin.maruai.cn"
            style="flex: 1; border-radius: 0 4px 4px 0;"
          />
        </div>
      </div>
      
      <div>
        <div style="display: block; margin-bottom: 8px; font-weight: 500;">当前状态</div>
        <span class="tag tag-{domainForm.api_domain ? 'success' : 'info'}">
          {domainForm.api_domain ? '已配置域名' : '使用IP访问'}
        </span>
      </div>
      
      <div style="display: flex; gap: 10px;">
        <Button type="primary" onClick={saveDomainSettings}>保存配置</Button>
        <Button onClick={testDomain} disabled={!domainForm.api_domain}>测试连接</Button>
      </div>
    </div>
  </Card>
  
  <!-- 发信邮箱配置 -->
  <Card title="发信邮箱配置" style="margin-bottom: 20px;">
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div>
        <label for="settings-smtp-host" style="display: block; margin-bottom: 8px; font-weight: 500;">SMTP 服务器</label>
        <Input
          id="settings-smtp-host"
          bind:value={mailForm.smtp_host}
          placeholder="如: smtp.qq.com"
          style="width: 320px;"
        />
      </div>
      
      <div>
        <label for="settings-smtp-port" style="display: block; margin-bottom: 8px; font-weight: 500;">SMTP 端口</label>
        <Input
          id="settings-smtp-port"
          type="number"
          bind:value={mailForm.smtp_port}
          min="1"
          max="65535"
          style="width: 180px;"
        />
      </div>
      
      <div>
        <label for="settings-smtp-user" style="display: block; margin-bottom: 8px; font-weight: 500;">发件邮箱</label>
        <Input
          id="settings-smtp-user"
          bind:value={mailForm.smtp_user}
          placeholder="如: noreply@example.com"
          style="width: 320px;"
        />
      </div>
      
      <div>
        <label for="settings-smtp-pass" style="display: block; margin-bottom: 8px; font-weight: 500;">邮箱密码/授权码</label>
        <Input
          id="settings-smtp-pass"
          type="password"
          bind:value={mailForm.smtp_pass}
          placeholder="SMTP授权码"
          style="width: 320px;"
        />
      </div>
      
      <div>
        <label for="settings-mail-from-name" style="display: block; margin-bottom: 8px; font-weight: 500;">发件人名称</label>
        <Input
          id="settings-mail-from-name"
          bind:value={mailForm.from_name}
          placeholder="如: 丸子配音"
          style="width: 320px;"
        />
      </div>
      
      <div style="display: flex; gap: 10px;">
        <Button type="primary" onClick={saveMailSettings}>保存配置</Button>
        <Button onClick={testMail}>测试发送</Button>
      </div>
    </div>
  </Card>
  
  <!-- 管理员设置 -->
  <Card title="管理员设置">
    <div style="display: flex; flex-direction: column; gap: 16px;">
      <div>
        <label for="settings-admin-username" style="display: block; margin-bottom: 8px; font-weight: 500;">用户名</label>
        <Input
          id="settings-admin-username"
          bind:value={adminForm.username}
          disabled={true}
          style="width: 320px;"
        />
      </div>
      
      <div>
        <label for="settings-admin-email" style="display: block; margin-bottom: 8px; font-weight: 500;">邮箱</label>
        <Input
          id="settings-admin-email"
          bind:value={adminForm.email}
          style="width: 320px;"
        />
      </div>
      
      <div>
        <label for="settings-admin-new-password" style="display: block; margin-bottom: 8px; font-weight: 500;">新密码</label>
        <Input
          id="settings-admin-new-password"
          type="password"
          bind:value={adminForm.new_password}
          placeholder="留空则不修改"
          style="width: 320px;"
        />
      </div>
      
      <div>
        <label for="settings-admin-confirm-password" style="display: block; margin-bottom: 8px; font-weight: 500;">确认密码</label>
        <Input
          id="settings-admin-confirm-password"
          type="password"
          bind:value={adminForm.confirm_password}
          placeholder="确认新密码"
          style="width: 320px;"
        />
      </div>
      
      <div>
        <Button type="primary" onClick={saveAdminSettings}>保存</Button>
      </div>
    </div>
  </Card>
</div>

<style>
  .tag {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
  }
  
  .tag-info {
    background: rgba(24, 144, 255, 0.1);
    border: 1px solid rgba(24, 144, 255, 0.3);
    color: #1890ff;
  }
  
  .tag-success {
    background: rgba(82, 196, 26, 0.1);
    border: 1px solid rgba(82, 196, 26, 0.3);
    color: #52c41a;
  }
  
  code {
    background: #f5f5f5;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 12px;
    font-family: 'Courier New', monospace;
  }
</style>
