<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import Logo from '$lib/icons/Logo.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';

  let version = $state('3.0.0');
  let build = $state('20260513');
  let installPath = $state('—');
  let dataDir = $state('—');

  let license = {
    type: '专业版',
    account: 'user***@example.com',
    key: 'MARU-****-****-Q8K3',
    state: '已激活',
    expire: '2026-12-31',
    days: 218,
    devices: '2 / 5',
  };

  const credits = [
    { name: 'Tauri', desc: '跨平台桌面应用框架' },
    { name: 'SvelteKit', desc: '前端框架与构建链' },
    { name: 'FastAPI', desc: '本地推理服务运行时' },
    { name: 'PyTorch', desc: '深度学习推理后端' },
    { name: 'FFmpeg', desc: '音视频处理工具链' },
    { name: 'Ant Design Icons', desc: '矢量图标系统' },
  ];

  onMount(async () => {
    try {
      const v = await invoke<string>('get_app_version');
      if (v) version = v;
    } catch {}
  });

  function handleCheckUpdate() {
    toast.info('已是最新版本（v' + version + '）');
  }
</script>

<div class="about-page">
  <div class="brand-wrap">
    <div class="brand-logo">
      <Logo size={88} color="var(--color-primary)" />
    </div>
    <h1 class="brand-title">丸子配音 V3</h1>
    <p class="brand-sub">专业 AI 配音与音频创作平台</p>
    <div class="brand-meta">
      <span class="meta-version">版本 {version}（Build {build}）</span>
      <span class="dot-sep">·</span>
      <button class="meta-link" onclick={handleCheckUpdate}>检查更新</button>
      <span class="dot-sep">·</span>
      <button class="meta-link" onclick={() => toast.info('更新日志开发中')}>更新日志</button>
    </div>
  </div>

  <div class="info-grid">
    <article class="card">
      <header class="card-head">
        <h2 class="card-title">授权信息</h2>
        <button class="card-extra" onclick={() => toast.info('授权管理开发中')}>
          管理授权 <Icon name="right" size={10} color="currentColor" />
        </button>
      </header>
      <div class="card-body">
        <dl class="kv">
          <div class="kv-row"><dt>授权类型</dt><dd><span class="badge-pro">{license.type}</span></dd></div>
          <div class="kv-row"><dt>授权账号</dt><dd>{license.account}</dd></div>
          <div class="kv-row"><dt>激活码</dt><dd class="mono">{license.key} <button class="icon-btn" onclick={() => toast.success('已复制激活码')}><Icon name="copy" size={12} color="var(--color-text-tertiary)" /></button></dd></div>
          <div class="kv-row"><dt>授权状态</dt><dd><span class="badge-active">{license.state}</span></dd></div>
          <div class="kv-row"><dt>到期时间</dt><dd>{license.expire}<span class="kv-extra">还剩 {license.days} 天</span></dd></div>
          <div class="kv-row"><dt>已激活设备</dt><dd>{license.devices}</dd></div>
        </dl>
        <div class="card-actions">
          <button class="btn-secondary" onclick={() => toast.info('授权管理开发中')}>管理授权</button>
          <button class="btn-primary" onclick={() => toast.info('企业版咨询请联系客服')}>
            <Icon name="crown" size={14} color="#fff" />
            <span>升级至企业版</span>
          </button>
        </div>
      </div>
    </article>

    <article class="card">
      <header class="card-head">
        <h2 class="card-title">软件信息</h2>
      </header>
      <div class="card-body">
        <dl class="kv">
          <div class="kv-row"><dt>核心引擎</dt><dd>轻量引擎 · 情感引擎 · 云端引擎</dd></div>
          <div class="kv-row"><dt>构建时间</dt><dd>{build.slice(0,4)}-{build.slice(4,6)}-{build.slice(6,8)} 14:30</dd></div>
          <div class="kv-row"><dt>应用大小</dt><dd>284 MB</dd></div>
          <div class="kv-row"><dt>安装路径</dt><dd class="mono ellipsis">{installPath}</dd></div>
          <div class="kv-row"><dt>数据目录</dt><dd class="mono ellipsis">{dataDir}</dd></div>
        </dl>
        <div class="card-actions">
          <button class="btn-secondary" onclick={() => toast.info('打开数据目录开发中')}>
            <Icon name="folder-open" size={14} color="currentColor" />
            <span>打开数据目录</span>
          </button>
          <button class="btn-secondary" onclick={() => toast.info('诊断日志导出开发中')}>
            <Icon name="export" size={14} color="currentColor" />
            <span>导出诊断日志</span>
          </button>
        </div>
      </div>
    </article>
  </div>

  <article class="card team-card">
    <header class="card-head">
      <h2 class="card-title">团队与生态</h2>
    </header>
    <div class="team-body">
      <section class="team-col">
        <h3 class="col-title">开发团队</h3>
        <div class="team-info">
          <div class="team-logo"><Logo size={36} color="var(--color-primary)" /></div>
          <div>
            <div class="team-name">丸子科技</div>
            <div class="team-slogan">专注 AI 音频创作工具</div>
          </div>
        </div>
        <button class="link" onclick={() => toast.info('企业介绍页开发中')}>
          了解我们 <Icon name="right" size={10} color="currentColor" />
        </button>
      </section>

      <section class="team-col">
        <h3 class="col-title">开源致谢</h3>
        <ul class="credits-list">
          {#each credits as item (item.name)}
            <li>
              <span class="credit-name">{item.name}</span>
              <span class="credit-desc">{item.desc}</span>
            </li>
          {/each}
        </ul>
      </section>

      <section class="team-col">
        <h3 class="col-title">联系我们</h3>
        <ul class="contact-list">
          <li><Icon name="global" size={14} color="var(--color-text-tertiary)" /><a href="https://maruvoice.com" onclick={(e) => { e.preventDefault(); toast.info('打开外链开发中'); }}>https://maruvoice.com</a></li>
          <li><Icon name="mail" size={14} color="var(--color-text-tertiary)" /><a href="mailto:support@maruvoice.com" onclick={(e) => { e.preventDefault(); toast.info('请联系 support@maruvoice.com'); }}>support@maruvoice.com</a></li>
          <li>
            <Icon name="usergroup" size={14} color="var(--color-text-tertiary)" />
            <button type="button" class="contact-link" onclick={() => toast.info('用户社区开发中')}>
              用户社区 community.maruvoice.com
            </button>
          </li>
          <li><Icon name="customer-service" size={14} color="var(--color-text-tertiary)" /><span>客服 QQ 群 123456789</span></li>
        </ul>
      </section>
    </div>
  </article>

  <footer class="about-foot">
    <span>© 2024 - 2026 MaruVoice. All rights reserved.</span>
    <div class="foot-links">
      <button class="meta-link" onclick={() => toast.info('用户协议开发中')}>用户协议</button>
      <button class="meta-link" onclick={() => toast.info('隐私政策开发中')}>隐私政策</button>
      <button class="meta-link" onclick={() => toast.info('服务条款开发中')}>服务条款</button>
    </div>
  </footer>
</div>

<style>
  .about-page {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: var(--spacing-xl) var(--spacing-xl) var(--spacing-lg);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-lg);
    background-color: var(--color-bg-container);
  }

  .brand-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xl) 0;
  }
  .brand-logo {
    width: 96px; height: 96px;
    border-radius: 24px;
    background-color: color-mix(in srgb, var(--color-primary) 14%, transparent);
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 32px color-mix(in srgb, var(--color-primary) 22%, transparent);
  }
  .brand-title {
    margin: var(--spacing-sm) 0 0;
    font-size: 36px;
    font-weight: 700;
    color: var(--color-text);
    letter-spacing: 0.4px;
  }
  .brand-sub {
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size);
  }
  .brand-meta {
    display: flex; align-items: center; gap: 6px;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    margin-top: var(--spacing-xs);
  }
  .meta-version { color: var(--color-text-tertiary); }
  .meta-link {
    background: transparent; border: none; cursor: pointer;
    color: var(--color-primary); font-size: var(--font-size-sm); padding: 2px 4px;
  }
  .meta-link:hover { text-decoration: underline; }
  .dot-sep { color: var(--color-text-quaternary); }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-lg);
    max-width: 960px;
    width: 100%;
    align-self: center;
  }

  .card {
    background-color: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
  }
  .card-head {
    height: 44px;
    padding: 0 var(--spacing-lg);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--color-border-secondary);
  }
  .card-title { margin: 0; color: var(--color-text); font-size: var(--font-size); font-weight: 500; }
  .card-extra {
    background: transparent; border: none; cursor: pointer;
    color: var(--color-primary); font-size: var(--font-size-sm);
    display: inline-flex; align-items: center; gap: 4px; padding: 4px 6px;
    border-radius: var(--border-radius-sm);
  }
  .card-extra:hover { background-color: var(--color-bg-spotlight); }
  .card-body { padding: var(--spacing-lg); }

  .kv { margin: 0; display: flex; flex-direction: column; gap: 12px; }
  .kv-row {
    display: grid;
    grid-template-columns: 96px 1fr;
    gap: var(--spacing-md);
    font-size: var(--font-size-sm);
  }
  .kv-row dt { color: var(--color-text-tertiary); margin: 0; }
  .kv-row dd { margin: 0; color: var(--color-text); display: flex; align-items: center; gap: 8px; min-width: 0; }
  .mono { font-family: ui-monospace, Menlo, Consolas, monospace; }
  .ellipsis { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .kv-extra { color: var(--color-primary); font-size: 11px; margin-left: 4px; }

  .badge-pro {
    background: linear-gradient(135deg, #d4a44a, #b8862c);
    color: #1a1a1a;
    padding: 2px 8px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
    font-weight: 600;
  }
  .badge-active {
    background: color-mix(in srgb, var(--color-success) 18%, transparent);
    color: var(--color-success);
    padding: 2px 8px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
  }

  .icon-btn {
    background: transparent; border: none; cursor: pointer; padding: 2px 4px;
    border-radius: var(--border-radius-sm);
  }
  .icon-btn:hover { background-color: var(--color-bg-spotlight); }

  .card-actions {
    display: flex; gap: var(--spacing-sm);
    margin-top: var(--spacing-md);
    justify-content: flex-end;
  }
  .btn-primary, .btn-secondary {
    display: inline-flex; align-items: center; gap: 6px;
    height: 32px; padding: 0 var(--spacing-md);
    font-size: var(--font-size-sm);
    border-radius: var(--border-radius);
    cursor: pointer; border: none;
    transition: background-color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing);
  }
  .btn-primary { background-color: var(--color-primary); color: #fff; }
  .btn-primary:hover { background-color: var(--color-primary-hover); }
  .btn-secondary { background-color: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border-secondary); }
  .btn-secondary:hover { border-color: var(--color-primary); color: var(--color-text); }

  .team-card { max-width: 960px; width: 100%; align-self: center; }
  .team-body {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--spacing-xl);
    padding: var(--spacing-lg);
  }
  .col-title {
    margin: 0 0 var(--spacing-sm); color: var(--color-text-tertiary);
    text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; font-weight: 500;
  }
  .team-info { display: flex; align-items: center; gap: var(--spacing-sm); margin-bottom: var(--spacing-sm); }
  .team-logo {
    width: 40px; height: 40px; border-radius: 8px;
    background-color: color-mix(in srgb, var(--color-primary) 18%, transparent);
    display: flex; align-items: center; justify-content: center;
  }
  .team-name { color: var(--color-text); font-weight: 500; font-size: var(--font-size); }
  .team-slogan { color: var(--color-text-tertiary); font-size: 11px; }

  .credits-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
  .credits-list li { display: flex; justify-content: space-between; gap: var(--spacing-sm); font-size: var(--font-size-sm); }
  .credit-name { color: var(--color-text); }
  .credit-desc { color: var(--color-text-tertiary); }

  .contact-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; font-size: var(--font-size-sm); color: var(--color-text-secondary); }
  .contact-list li { display: flex; align-items: center; gap: 8px; }
  .contact-list a,
  .contact-link {
    color: var(--color-primary);
    text-decoration: none;
    background: transparent;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
  }
  .contact-list a:hover,
  .contact-link:hover { text-decoration: underline; }

  .link {
    display: inline-flex; align-items: center; gap: 4px;
    background: transparent; border: none; cursor: pointer;
    color: var(--color-primary); font-size: var(--font-size-sm); padding: 4px 0;
  }
  .link:hover { text-decoration: underline; }

  .about-foot {
    max-width: 960px;
    width: 100%;
    align-self: center;
    margin-top: var(--spacing-md);
    padding-top: var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--color-text-tertiary);
    font-size: 11px;
  }
  .foot-links { display: flex; gap: var(--spacing-md); }
</style>
