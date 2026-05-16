<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  const tree = [
    { name: '我的项目', level: 0, open: true },
    { name: '风起云涌 第12集', level: 1, open: true },
    { name: '脚本', level: 2 },
    { name: '配音', level: 2, active: true },
    { name: '字幕', level: 2 },
    { name: '视频', level: 2 },
    { name: 'BGM', level: 2 },
    { name: '输出', level: 2 },
    { name: '星河漫游', level: 1 },
    { name: '时间之门 第3季', level: 1 },
    { name: '本地素材', level: 0, open: true },
    { name: '参考音频', level: 1 },
    { name: '情感音频', level: 1 },
    { name: '预置样音', level: 1 },
    { name: '临时缓存', level: 1 },
    { name: '回收站', level: 0 },
  ];

  const files = [
    { name: 'EP12_角色甲_001.wav', type: '音频', duration: '00:00:28', size: '5.24 MB', status: '已完成', icon: 'file-audio', selected: false },
    { name: 'EP12_角色甲_002.wav', type: '音频', duration: '00:00:28', size: '5.24 MB', status: '已上传', icon: 'file-audio', selected: true },
    { name: 'EP12_角色乙_001.wav', type: '音频', duration: '00:00:28', size: '5.24 MB', status: '已完成', icon: 'file-audio', selected: true },
    { name: 'EP12_zhumu_zh.srt', type: '字幕', duration: '00:00:28', size: '102 KB', status: '已上传', icon: 'subtitle', selected: false },
    { name: 'EP12_master.mp4', type: '视频', duration: '00:23:45', size: '1.24 GB', status: '已完成', icon: 'file-video', selected: false },
    { name: 'EP12_project.maru', type: '工程', duration: '—', size: '28.6 MB', status: '草稿', icon: 'project-box', selected: false },
    { name: 'ref_qingfei.wav', type: '参考', duration: '00:00:28', size: '5.24 MB', status: '缓存', icon: 'sound', selected: false },
    { name: 'EP12_旁白_001.wav', type: '音频', duration: '00:00:28', size: '5.24 MB', status: '已完成', icon: 'file-audio', selected: false },
    { name: 'EP12_zhumu_en.srt', type: '字幕', duration: '00:00:28', size: '98 KB', status: '缓存', icon: 'subtitle', selected: false },
    { name: 'EP12_preview.mp4', type: '视频', duration: '01:02:15', size: '512 MB', status: '已上传', icon: 'file-video', selected: false },
  ];
</script>

<div class="files-page">
  <aside class="tree-panel">
    <div class="tree-search">
      <input placeholder="搜索目录…" />
      <Icon name="search" size={14} color="var(--color-text-tertiary)" />
    </div>
    <div class="tree-list">
      {#each tree as node (node.name)}
        <button
          type="button"
          class="tree-node"
          class:active={node.active}
          style="--level:{node.level}"
          onclick={() => toast.info(`打开 ${node.name}`)}
        >
          <Icon name={node.open ? 'down' : 'right'} size={10} color="var(--color-text-tertiary)" />
          <Icon name={node.open || node.active ? 'folder-open' : 'cover'} size={14} color="currentColor" />
          <span>{node.name}</span>
        </button>
      {/each}
    </div>
  </aside>

  <main class="file-main">
    <header class="file-toolbar">
      <div class="breadcrumb">我的项目 / 风起云涌 第12集 / 配音</div>
      <div class="toolbar-row">
        <div class="file-search"><Icon name="search" size={14} color="var(--color-text-tertiary)" /><input placeholder="搜索文件…" /></div>
        <select><option>类型</option></select>
        <select><option>状态</option></select>
        <select><option>日期范围</option></select>
        <button type="button" onclick={() => toast.info('新建文件夹开发中')}>+ 新建文件夹</button>
        <button type="button" onclick={() => toast.info('导入文件开发中')}>导入文件</button>
        <button type="button" class="primary" onclick={() => toast.success('已加入批量导出队列')}>批量导出</button>
        <button type="button" class="icon-btn active"><Icon name="bars" size={15} color="currentColor" /></button>
        <button type="button" class="icon-btn"><Icon name="appstore" size={15} color="currentColor" /></button>
        <button type="button" class="icon-btn"><Icon name="refresh" size={15} color="currentColor" /></button>
      </div>
    </header>

    <section class="file-table">
      <div class="table-head">
        <span></span><span>文件名</span><span>类型</span><span>时长</span><span>大小</span><span>修改时间</span><span>状态</span><span>操作</span>
      </div>
      {#each files as file (file.name)}
        <div class="file-row" class:selected={file.selected}>
          <label><input type="checkbox" checked={file.selected} /></label>
          <div class="file-name"><Icon name={file.icon} size={16} color="var(--color-primary)" /><span>{file.name}</span></div>
          <span class="type-badge">{file.type}</span>
          <span>{file.duration}</span>
          <span>{file.size}</span>
          <span>2026-05-20 14:30</span>
          <span class="status {file.status}">{file.status}</span>
          <div class="actions">
            <button><Icon name="play" size={14} color="currentColor" /></button>
            <button><Icon name="folder-open" size={14} color="currentColor" /></button>
            <button><Icon name="copy" size={14} color="currentColor" /></button>
            <button><Icon name="delete" size={14} color="currentColor" /></button>
          </div>
        </div>
      {/each}
    </section>

    <footer class="file-status">
      <span>已选 3 项（1.28 GB）/ 共 246 项</span>
      <button type="button">导出选中</button>
    </footer>
  </main>

  <aside class="preview-panel">
    <h2>文件预览</h2>
    <div class="wave-preview">
      {#each Array(64) as _, i (i)}
        <span style="height:{15 + ((i * 19) % 70)}%"></span>
      {/each}
    </div>
    <div class="audio-line">
      <button type="button"><Icon name="play-fill" size={18} color="#fff" /></button>
      <div><span style="width:45%"></span></div>
      <em>00:00:12 / 00:00:28</em>
    </div>

    <div class="info-list">
      <h3>文件信息</h3>
      <div><span>完整路径</span><strong>D:/MaruAudio/Projects/FengQiYunYong_Ep12/02_Audio/EP12_角色甲_002.wav</strong><Icon name="copy" size={13} color="var(--color-text-tertiary)" /></div>
      <div><span>格式</span><strong>WAV PCM</strong></div>
      <div><span>采样率</span><strong>24,000 Hz</strong></div>
      <div><span>声道</span><strong>单声道</strong></div>
      <div><span>生成时间</span><strong>2026-05-20 14:30:18</strong></div>
      <div><span>使用引擎</span><strong class="engine">轻量引擎</strong></div>
      <div><span>关联项目</span><button>《风起云涌》第12集</button></div>
    </div>

    <label class="note-box">
      <span>备注</span>
      <textarea placeholder="请输入备注信息…"></textarea>
    </label>

    <div class="preview-actions">
      <button type="button">打开所在位置</button>
      <button type="button" class="primary">复制为引用</button>
    </div>
  </aside>
</div>

<style>
  .files-page {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 240px minmax(0, 1fr) 300px;
    background-color: var(--color-bg-container);
    overflow: hidden;
  }

  .tree-panel,
  .preview-panel {
    border-right: 1px solid var(--color-border-secondary);
    background-color: var(--color-bg-container);
    padding: var(--spacing-md);
    overflow-y: auto;
  }

  .preview-panel {
    border-left: 1px solid var(--color-border-secondary);
    border-right: none;
  }

  .tree-search,
  .file-search {
    height: 34px;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-sm);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
  }

  input,
  textarea,
  select {
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text);
    font-family: inherit;
  }

  .tree-search input,
  .file-search input {
    flex: 1;
    min-width: 0;
  }

  .tree-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: var(--spacing-md);
  }

  .tree-node {
    height: 30px;
    display: flex;
    align-items: center;
    gap: 6px;
    padding-left: calc(8px + var(--level) * 18px);
    padding-right: var(--spacing-sm);
    border: none;
    border-radius: var(--border-radius-sm);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }

  .tree-node.active,
  .tree-node:hover {
    background-color: var(--color-bg-spotlight);
    color: var(--color-primary);
  }

  .tree-node span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .file-toolbar {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .breadcrumb {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .toolbar-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
  }

  .file-search {
    width: 180px;
  }

  .toolbar-row select,
  .toolbar-row button {
    height: 32px;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    background-color: var(--color-bg-base);
    color: var(--color-text-secondary);
    padding: 0 var(--spacing-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }

  .toolbar-row .primary,
  .preview-actions .primary {
    border-color: var(--color-primary);
    background-color: var(--color-primary);
    color: #fff;
  }

  .toolbar-row .icon-btn {
    width: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .toolbar-row .icon-btn.active {
    color: #fff;
    background-color: var(--color-primary);
  }

  .file-table {
    flex: 1;
    overflow-y: auto;
    padding: var(--spacing-md);
  }

  .table-head,
  .file-row {
    display: grid;
    grid-template-columns: 28px minmax(210px, 1.6fr) 70px 80px 90px 150px 78px 120px;
    align-items: center;
    gap: var(--spacing-sm);
    min-height: 38px;
    font-size: var(--font-size-sm);
  }

  .table-head {
    color: var(--color-text-tertiary);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .file-row {
    color: var(--color-text-secondary);
    border-bottom: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
  }

  .file-row.selected {
    background-color: color-mix(in srgb, var(--color-primary) 16%, transparent);
  }

  .file-name {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-text);
    min-width: 0;
  }

  .file-name span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .type-badge,
  .status,
  .engine {
    justify-self: start;
    padding: 2px 7px;
    border-radius: var(--border-radius-sm);
    font-size: 11px;
    color: var(--color-primary);
    background-color: color-mix(in srgb, var(--color-primary) 14%, transparent);
  }

  .status.已完成 { color: var(--color-success); background-color: color-mix(in srgb, var(--color-success) 14%, transparent); }
  .status.草稿 { color: var(--color-warning); background-color: color-mix(in srgb, var(--color-warning) 14%, transparent); }
  .status.缓存 { color: var(--color-text-tertiary); background-color: var(--color-bg-base); }

  .actions {
    display: flex;
    gap: 4px;
  }

  .actions button {
    width: 24px;
    height: 24px;
    border: none;
    border-radius: var(--border-radius-sm);
    background: transparent;
    color: var(--color-text-tertiary);
    cursor: pointer;
  }

  .actions button:hover {
    background-color: var(--color-bg-spotlight);
    color: var(--color-text);
  }

  .file-status {
    height: 40px;
    flex-shrink: 0;
    border-top: 1px solid var(--color-border-secondary);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 var(--spacing-md);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .file-status button {
    background: transparent;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
  }

  .preview-panel h2 {
    margin: 0 0 var(--spacing-md);
    color: var(--color-text);
    font-size: var(--font-size);
  }

  .wave-preview {
    height: 86px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: var(--spacing-md);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background-color: var(--color-bg-base);
  }

  .wave-preview span {
    flex: 1;
    border-radius: 999px;
    background-color: var(--color-primary);
    opacity: 0.8;
  }

  .audio-line {
    margin: var(--spacing-md) 0;
    display: grid;
    grid-template-columns: 34px 1fr auto;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .audio-line button {
    width: 34px;
    height: 34px;
    border: none;
    border-radius: 50%;
    background-color: var(--color-primary);
  }

  .audio-line div {
    height: 4px;
    border-radius: 2px;
    background-color: var(--color-border);
    overflow: hidden;
  }

  .audio-line div span {
    display: block;
    height: 100%;
    background-color: var(--color-primary);
  }

  .audio-line em {
    font-style: normal;
    color: var(--color-text-tertiary);
    font-size: 11px;
  }

  .info-list {
    border-top: 1px solid var(--color-border-secondary);
    padding-top: var(--spacing-md);
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .info-list h3 {
    margin: 0 0 var(--spacing-xs);
    color: var(--color-text);
    font-size: var(--font-size);
  }

  .info-list div {
    display: grid;
    grid-template-columns: 72px 1fr auto;
    gap: var(--spacing-sm);
    align-items: center;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .info-list span {
    color: var(--color-text-tertiary);
  }

  .info-list strong {
    font-weight: 400;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .info-list button {
    background: transparent;
    border: none;
    color: var(--color-primary);
    cursor: pointer;
    padding: 0;
    text-align: left;
  }

  .note-box {
    margin: var(--spacing-md) 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .note-box textarea {
    height: 92px;
    padding: var(--spacing-sm);
    resize: none;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background-color: var(--color-bg-base);
    color: var(--color-text);
  }

  .preview-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .preview-actions button {
    flex: 1;
    height: 32px;
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border-secondary);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
  }
</style>
