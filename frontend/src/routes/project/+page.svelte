<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  type EngineKey = 'light' | 'emotion' | 'cloud';

  const engines: Array<{ key: EngineKey; name: string; desc: string; icon: string }> = [
    { key: 'light', name: '轻量引擎', desc: '速度优先，适合批量台词', icon: 'thunderbolt' },
    { key: 'emotion', name: '情感引擎', desc: '情绪与韵律更自然', icon: 'heart' },
    { key: 'cloud', name: '云端引擎', desc: '云端情感能力', icon: 'cloud' },
  ];

  const roles = [
    { name: '林澈', type: '主角', voice: '磁性男声', lines: 48, color: '#4096ff', active: true },
    { name: '苏晚', type: '女主', voice: '温暖女声', lines: 36, color: '#b37feb' },
    { name: '旁白', type: '旁白', voice: '沉稳男声', lines: 22, color: '#faad14' },
    { name: '少年', type: '配角', voice: '活力少年', lines: 18, color: '#36cfc9' },
    { name: '反派', type: '配角', voice: '低沉男声', lines: 14, color: '#ff7875' },
  ];

  const lines = [
    { id: '001', role: '林澈', text: '如果这扇门真的通往过去，那我们必须在天亮前做出选择。', emotion: '紧张', speed: '1.00', duration: '00:04.8', status: '待生成' },
    { id: '002', role: '苏晚', text: '我不怕改变历史，我只怕你再也回不来了。', emotion: '悲伤', speed: '0.92', duration: '00:05.2', status: '已生成' },
    { id: '003', role: '旁白', text: '走廊尽头的钟声敲响，所有人的呼吸都停在了同一秒。', emotion: '旁白', speed: '0.96', duration: '00:06.4', status: '已生成' },
    { id: '004', role: '少年', text: '快看，墙上的影子动了！', emotion: '惊讶', speed: '1.08', duration: '00:02.7', status: '待生成' },
    { id: '005', role: '反派', text: '你以为自己是在拯救他们，其实只是亲手打开了牢笼。', emotion: '冷漠', speed: '0.88', duration: '00:06.1', status: '草稿' },
    { id: '006', role: '林澈', text: '我会回来，这是我给你的承诺。', emotion: '坚定', speed: '0.98', duration: '00:03.9', status: '待生成' },
  ];

  let activeEngine: EngineKey = $state('emotion');

  const engineTitle = $derived(engines.find((item) => item.key === activeEngine)?.name ?? '情感引擎');
</script>

<div class="roles-page">
  <aside class="role-panel">
    <header class="panel-head">
      <h2>角色管理</h2>
      <button type="button" onclick={() => toast.info('新增角色开发中')}>+ 新增</button>
    </header>
    <div class="role-list">
      {#each roles as role (role.name)}
        <button type="button" class="role-card" class:active={role.active} style="--role-color:{role.color}">
          <span class="avatar">{role.name.slice(0, 1)}</span>
          <div>
            <strong>{role.name}<em>{role.type}</em></strong>
            <small>{role.voice} · {role.lines} 句台词</small>
          </div>
        </button>
      {/each}
    </div>

    <section class="import-card">
      <Icon name="import" size={22} color="var(--color-primary)" />
      <h3>脚本导入</h3>
      <p>支持 TXT / SRT / JSON，自动识别角色与台词顺序。</p>
      <button type="button" onclick={() => toast.info('脚本导入开发中')}>导入脚本</button>
    </section>
  </aside>

  <main class="script-panel">
    <header class="script-toolbar">
      <div>
        <h1>《风起云涌》第12集</h1>
        <p>6 个角色 · 138 句台词 · 预计生成 23 分钟音频</p>
      </div>
      <div class="toolbar-actions">
        <button type="button"><Icon name="save" size={14} color="currentColor" />保存草稿</button>
        <button type="button"><Icon name="play-fill" size={14} color="currentColor" />试听选中</button>
        <button type="button" class="primary" onclick={() => toast.success('已加入批量生成队列')}>批量生成</button>
      </div>
    </header>

    <section class="engine-strip" aria-label="引擎选择">
      {#each engines as engine (engine.key)}
        <button type="button" class:active={activeEngine === engine.key} onclick={() => (activeEngine = engine.key)}>
          <Icon name={engine.icon} size={18} color="currentColor" />
          <div><strong>{engine.name}</strong><span>{engine.desc}</span></div>
        </button>
      {/each}
    </section>

    <section class="line-table">
      <div class="table-head"><span>#</span><span>角色</span><span>台词内容</span><span>情绪</span><span>语速</span><span>时长</span><span>状态</span><span>操作</span></div>
      {#each lines as line (line.id)}
        <article class="line-row">
          <span class="line-id">{line.id}</span>
          <span class="role-name">{line.role}</span>
          <textarea value={line.text} aria-label={`${line.role} 台词`}></textarea>
          <select value={line.emotion} aria-label="情绪">
            <option>{line.emotion}</option>
            <option>平静</option>
            <option>开心</option>
            <option>悲伤</option>
            <option>愤怒</option>
            <option>惊讶</option>
          </select>
          <input value={line.speed} aria-label="语速" />
          <span>{line.duration}</span>
          <span class="status {line.status}">{line.status}</span>
          <div class="row-actions"><button><Icon name="play" size={14} color="currentColor" /></button><button><Icon name="copy" size={14} color="currentColor" /></button><button><Icon name="delete" size={14} color="currentColor" /></button></div>
        </article>
      {/each}
    </section>
  </main>

  <aside class="param-panel">
    <header class="panel-head">
      <h2>{engineTitle}参数</h2>
      <button type="button" onclick={() => toast.info('已恢复默认参数')}>重置</button>
    </header>

    {#if activeEngine === 'light'}
      <section class="param-group">
        <h3>基础生成</h3>
        <label>语速倍率 <span>1.00</span><input type="range" min="0.75" max="1.25" step="0.01" value="1.00" /></label>
        <label>随机种子 <input value="auto" /></label>
        <label>分句长度 <select><option>智能分句</option><option>短句优先</option><option>长句优先</option></select></label>
        <label>批量并发 <select><option>2 路</option><option>4 路</option></select></label>
      </section>
      <section class="tip-card"><Icon name="thunderbolt" size={16} color="var(--color-primary)" />轻量引擎适合稳定批量出音，不显示情感参考音频和高级情绪向量。</section>
    {:else if activeEngine === 'emotion'}
      <section class="param-group">
        <h3>情感控制</h3>
        <label>情感强度 <span>0.80</span><input type="range" min="0" max="1" step="0.01" value="0.80" /></label>
        <label>情感参考音频 <button type="button">选择音频</button></label>
        <label>情绪标签 <select><option>按台词情绪</option><option>统一使用：坚定</option></select></label>
        <label>韵律稳定度 <span>0.65</span><input type="range" min="0" max="1" step="0.01" value="0.65" /></label>
        <label>文本情感权重 <span>0.55</span><input type="range" min="0" max="1" step="0.01" value="0.55" /></label>
      </section>
      <section class="tip-card"><Icon name="heart" size={16} color="var(--color-primary)" />情感引擎用于需要情绪变化、停顿和语气层次的角色对白。</section>
    {:else}
      <section class="param-group">
        <h3>云端生成</h3>
        <label>云端账户 <button type="button">连接账户</button></label>
        <label>情感模式 <select><option>云端情感增强</option><option>标准生成</option></select></label>
        <label>队列优先级 <select><option>普通</option><option>加速</option></select></label>
        <label>自动回传本地 <input type="checkbox" checked /></label>
        <label>失败重试 <select><option>3 次</option><option>5 次</option></select></label>
      </section>
      <section class="tip-card"><Icon name="cloud" size={16} color="var(--color-primary)" />云端引擎等同情感能力云端版本，适合本地显存不足时使用。</section>
    {/if}

    <section class="param-group">
      <h3>输出</h3>
      <label>输出格式 <select><option>WAV 24kHz</option><option>MP3 320kbps</option></select></label>
      <label>自动响度归一化 <input type="checkbox" checked /></label>
      <label>生成后自动入库 <input type="checkbox" checked /></label>
    </section>

    <div class="summary-card">
      <strong>生成预估</strong>
      <span>选中台词：6 句</span>
      <span>预计耗时：1 分 42 秒</span>
      <span>输出大小：约 48 MB</span>
    </div>
  </aside>
</div>

<style>
  .roles-page {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 260px minmax(0, 1fr) 320px;
    background: var(--color-bg-container);
    overflow: hidden;
  }

  .role-panel,
  .param-panel {
    border-right: 1px solid var(--color-border-secondary);
    overflow-y: auto;
    background: var(--color-bg-container);
  }

  .param-panel {
    border-right: none;
    border-left: 1px solid var(--color-border-secondary);
  }

  .panel-head {
    height: 48px;
    padding: 0 var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .panel-head h2 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size);
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  .panel-head button {
    border: none;
    background: transparent;
    color: var(--color-primary);
  }

  .role-list {
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .role-card {
    width: 100%;
    min-height: 64px;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background: var(--color-bg-elevated);
    color: var(--color-text);
    text-align: left;
  }

  .role-card.active,
  .role-card:hover {
    border-color: var(--role-color);
    background: color-mix(in srgb, var(--role-color) 12%, var(--color-bg-elevated));
  }

  .avatar {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--role-color);
    color: #fff;
    font-weight: 700;
  }

  .role-card div {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .role-card strong {
    display: flex;
    gap: 6px;
    align-items: center;
    font-size: var(--font-size);
  }

  .role-card em {
    font-style: normal;
    color: var(--role-color);
    font-size: 11px;
  }

  .role-card small {
    color: var(--color-text-tertiary);
    font-size: 11px;
  }

  .import-card {
    margin: var(--spacing-md);
    padding: var(--spacing-md);
    border: 1px dashed var(--color-primary);
    border-radius: var(--border-radius-lg);
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
  }

  .import-card h3 {
    margin: var(--spacing-sm) 0 4px;
    color: var(--color-text);
    font-size: var(--font-size);
  }

  .import-card p {
    margin: 0 0 var(--spacing-md);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    line-height: 1.5;
  }

  .import-card button,
  .toolbar-actions .primary {
    border: none;
    border-radius: var(--border-radius);
    background: var(--color-primary);
    color: #fff;
  }

  .import-card button {
    height: 32px;
    padding: 0 var(--spacing-md);
  }

  .script-panel {
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .script-toolbar {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .script-toolbar h1 {
    margin: 0;
    color: var(--color-text);
    font-size: 20px;
  }

  .script-toolbar p {
    margin: 6px 0 0;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .toolbar-actions button {
    height: 34px;
    padding: 0 var(--spacing-sm);
    display: flex;
    align-items: center;
    gap: 5px;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background: var(--color-bg-base);
    color: var(--color-text-secondary);
  }

  .engine-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .engine-strip button {
    min-height: 68px;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-md);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    background: var(--color-bg-elevated);
    color: var(--color-text-secondary);
    text-align: left;
  }

  .engine-strip button.active {
    border-color: var(--color-primary);
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }

  .engine-strip div {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .engine-strip strong {
    color: var(--color-text);
    font-size: var(--font-size);
  }

  .engine-strip span {
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  .line-table {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--spacing-md);
  }

  .table-head,
  .line-row {
    display: grid;
    grid-template-columns: 48px 78px minmax(260px, 1fr) 90px 58px 70px 78px 92px;
    gap: var(--spacing-sm);
    align-items: center;
    font-size: var(--font-size-sm);
  }

  .table-head {
    height: 34px;
    color: var(--color-text-tertiary);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .line-row {
    min-height: 62px;
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .line-id,
  .role-name {
    color: var(--color-text);
  }

  textarea,
  select,
  input {
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    background: var(--color-bg-base);
    color: var(--color-text-secondary);
    font-family: inherit;
    font-size: var(--font-size-sm);
  }

  textarea {
    height: 46px;
    padding: 7px var(--spacing-sm);
    resize: none;
  }

  select,
  input {
    height: 30px;
    padding: 0 7px;
  }

  .status {
    justify-self: start;
    padding: 2px 7px;
    border-radius: var(--border-radius-sm);
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
    font-size: 11px;
  }

  .status.已生成 { color: var(--color-success); background: color-mix(in srgb, var(--color-success) 14%, transparent); }
  .status.草稿 { color: var(--color-warning); background: color-mix(in srgb, var(--color-warning) 14%, transparent); }

  .row-actions {
    display: flex;
    gap: 4px;
  }

  .row-actions button {
    width: 25px;
    height: 25px;
    border: none;
    border-radius: var(--border-radius-sm);
    background: transparent;
    color: var(--color-text-tertiary);
  }

  .row-actions button:hover {
    color: var(--color-text);
    background: var(--color-bg-spotlight);
  }

  .param-group {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .param-group h3 {
    margin: 0 0 var(--spacing-xs);
    color: var(--color-text);
    font-size: var(--font-size);
  }

  .param-group label {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--spacing-sm);
    align-items: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .param-group label > input[type='range'],
  .param-group label > select,
  .param-group label > input:not([type='checkbox']),
  .param-group label > button {
    grid-column: 1 / -1;
  }

  .param-group button {
    height: 30px;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    background: var(--color-bg-base);
    color: var(--color-primary);
  }

  .tip-card,
  .summary-card {
    margin: var(--spacing-md);
    border-radius: var(--border-radius);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .tip-card {
    padding: var(--spacing-md);
    display: flex;
    gap: var(--spacing-sm);
    line-height: 1.5;
  }

  .summary-card {
    padding: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .summary-card strong {
    color: var(--color-text);
  }
</style>
