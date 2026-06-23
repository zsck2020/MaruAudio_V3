<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import WaveformView from '$lib/components/ui/WaveformView.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { convertFileSrc } from '@tauri-apps/api/core';

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

  let fileAudioEl: HTMLAudioElement | undefined = $state();
  let fileAudioPlaying = $state(false);
  let fileAudioTime = $state(0);
  let fileAudioDuration = $state(0);
  let fileAudioSrc = $state('');

  function toggleFileAudio() {
    if (!fileAudioEl || !fileAudioSrc) return;
    if (fileAudioPlaying) { fileAudioEl.pause(); fileAudioPlaying = false; }
    else { void fileAudioEl.play(); fileAudioPlaying = true; }
  }

  function handleFileAudioSeek(time: number) {
    if (fileAudioEl) { fileAudioEl.currentTime = time; fileAudioTime = time; }
  }
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
        <Select size="sm" ariaLabel="类型筛选" placeholder="类型" options={[]} />
        <Select size="sm" ariaLabel="状态筛选" placeholder="状态" options={[]} />
        <Select size="sm" ariaLabel="日期范围筛选" placeholder="日期范围" options={[]} />
        <Button variant="default" size="sm" disabled>+ 新建文件夹</Button>
        <Button variant="default" size="sm" disabled>导入文件</Button>
        <Button variant="primary" size="sm" onclick={() => toast.success('已加入批量导出队列')}>批量导出</Button>
        <Button variant="primary" size="sm" prefixIcon="bars" iconOnly ariaLabel="列表视图" />
        <Button variant="default" size="sm" prefixIcon="appstore" iconOnly ariaLabel="网格视图" />
        <Button variant="default" size="sm" prefixIcon="refresh" iconOnly ariaLabel="刷新" />
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
      <Button variant="link" size="sm">导出选中</Button>
    </footer>
  </main>

  <aside class="preview-panel">
    <h2>文件预览</h2>
    {#if fileAudioSrc}
      <audio
        bind:this={fileAudioEl}
        src={fileAudioSrc}
        preload="metadata"
        ontimeupdate={() => { if (fileAudioEl) fileAudioTime = fileAudioEl.currentTime; }}
        onloadedmetadata={() => { if (fileAudioEl) fileAudioDuration = fileAudioEl.duration; }}
        onended={() => { fileAudioPlaying = false; fileAudioTime = 0; }}
        class="hidden-audio"
      ></audio>
    {/if}
    <div class="wave-preview-area">
      {#if fileAudioSrc}
        <WaveformView
          audioSrc={fileAudioSrc}
          currentTime={fileAudioTime}
          duration={fileAudioDuration}
          onSeek={handleFileAudioSeek}
          height={64}
          barWidth={2}
          barGap={1}
        />
      {:else}
        <div class="wave-preview">
          {#each Array(64) as _, i (i)}
            <span style="height:{15 + ((i * 19) % 70)}%"></span>
          {/each}
        </div>
      {/if}
    </div>
    <div class="audio-line">
      <button type="button" onclick={toggleFileAudio} aria-label={fileAudioPlaying ? '暂停' : '播放'}>
        <Icon name={fileAudioPlaying ? 'pause-fill' : 'play-fill'} size={18} color="#fff" />
      </button>
      <div><span style="width:{fileAudioDuration > 0 ? (fileAudioTime / fileAudioDuration * 100) : 0}%"></span></div>
      <em>{Math.floor(fileAudioTime / 60).toString().padStart(2, '0')}:{Math.floor(fileAudioTime % 60).toString().padStart(2, '0')} / {Math.floor(fileAudioDuration / 60).toString().padStart(2, '0')}:{Math.floor(fileAudioDuration % 60).toString().padStart(2, '0')}</em>
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
      <Button variant="default" size="sm" block>打开所在位置</Button>
      <Button variant="primary" size="sm" block>复制为引用</Button>
    </div>
  </aside>
</div>

<style>
  .files-page {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: clamp(180px, 20vw, 240px) minmax(0, 1fr) clamp(220px, 24vw, 300px);
    gap: var(--spacing-sm);
    padding: 15px;
    background-color: var(--color-bg-container);
    overflow: hidden;
  }

  @media (max-width: 1000px) {
    .files-page {
      grid-template-columns: minmax(0, 1fr) clamp(180px, 22vw, 260px);
    }
    .tree-panel {
      display: none;
    }
  }

  @media (max-width: 800px) {
    .files-page {
      grid-template-columns: 1fr;
      overflow: hidden;
    }
    .preview-panel {
      max-height: 280px;
      overflow: hidden;
    }
  }

  .tree-panel,
  .preview-panel {
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-md);
    overflow: hidden;
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
  textarea {
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
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
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

  .file-table {
    flex: 1;
    overflow: hidden;
    padding: var(--spacing-sm);
  }

  .table-head,
  .file-row {
    display: grid;
    grid-template-columns: 28px minmax(120px, 1.6fr) 60px 70px 80px minmax(90px, 150px) 68px minmax(80px, 120px);
    align-items: center;
    gap: var(--spacing-xs);
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
    font-variant-numeric: tabular-nums;
  }

  .wave-preview-area {
    border-radius: var(--border-radius);
    overflow: hidden;
  }

  .hidden-audio { display: none; }

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

  .preview-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .preview-actions :global(.ui-btn) {
    flex: 1;
  }
</style>
