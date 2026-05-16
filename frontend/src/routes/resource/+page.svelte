<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { vocalSeparate, vocalSeparateInfo } from '$lib/api/tts';

  interface Voice {
    name: string;
    meta: string;
    tags: string[];
    pro: boolean;
    uses: number;
    tone: string;
    /** 本地文件路径（导入的样音才有） */
    filePath?: string;
  }

  const categories = [
    ['全部样音', '', 'appstore'],
    ['我的收藏', '0', 'star'],
    ['最近使用', '0', 'history'],
  ];

  const voiceTypes = [
    ['男声', '345', 'avatar'],
    ['女声', '412', 'avatar'],
    ['童声', '56', 'smile'],
    ['影视', '218', 'video-camera'],
    ['情感', '186', 'heart'],
    ['旁白', '124', 'message'],
    ['童趣', '48', 'gift'],
    ['方言', '28', 'global'],
  ];

  const tags = ['温暖', '磁性', '活泼', '沉稳', '清亮', '低沉'];

  const PRESET_VOICES: Voice[] = [
    { name: '磁性男声', meta: '中文 · 35-45 岁 · 叙事', tags: ['磁性', '沉稳', '叙事'], pro: true, uses: 156, tone: 'blue' },
    { name: '温暖女声', meta: '中文 · 25-35 岁 · 抒情', tags: ['温暖', '抒情', '治愈'], pro: false, uses: 98, tone: 'purple' },
    { name: '活力少年', meta: '中文 · 12-18 岁 · 活泼', tags: ['活泼', '青春', '阳光'], pro: false, uses: 73, tone: 'pink' },
    { name: '沉稳男声', meta: '中文 · 30-45 岁 · 旁白', tags: ['沉稳', '旁白', '大气'], pro: true, uses: 210, tone: 'orange' },
    { name: '治愈女声', meta: '中文 · 20-30 岁 · 治愈', tags: ['治愈', '温柔', '情感'], pro: false, uses: 134, tone: 'green' },
    { name: '粤语男声', meta: '粤语 · 30-45 岁 · 叙事', tags: ['粤语', '磁性', '叙事'], pro: true, uses: 89, tone: 'cyan' },
  ];

  const IMPORT_TONES = ['blue', 'purple', 'pink', 'orange', 'green', 'cyan'];

  let voices = $state<Voice[]>([...PRESET_VOICES]);
  let selected = $state<Voice>(PRESET_VOICES[0]);

  let autoVocalSeparate = $state(true);
  let vocalAvailable = $state<boolean | null>(null);
  let vocalMethod = $state<string>('unknown');
  let isImporting = $state(false);
  let importProgress = $state(0);
  let importMessage = $state('');

  $effect(() => {
    void (async () => {
      try {
        const info = await vocalSeparateInfo();
        vocalAvailable = info.available;
        vocalMethod = info.method;
      } catch {
        vocalAvailable = false;
        vocalMethod = 'unreachable';
      }
    })();
  });

  function handleApply() {
    if (selected.filePath) {
      dubbing.setVoice('preset', selected.name, selected.filePath);
      toast.success(`已将「${selected.name}」应用到配音页`);
    } else {
      toast.info(`「${selected.name}」是预置样音占位，导入实际样音后可应用到配音页`);
    }
  }

  async function selectAudioFile(): Promise<{ path: string; baseName: string } | null> {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          { name: '音视频', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm', 'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'] },
        ],
      });
      if (!selected || Array.isArray(selected)) return null;
      const fullPath = selected as string;
      const baseName = fullPath.split(/[\\/]/).pop() || '未命名样音';
      return { path: fullPath, baseName };
    } catch (err) {
      toast.warning(`选择文件失败：${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async function copyToRefAudio(srcPath: string, displayName: string): Promise<string> {
    const { readFile, writeFile, mkdir, exists } = await import('@tauri-apps/plugin-fs');
    const { join, appDataDir } = await import('@tauri-apps/api/path');
    const { getOutputDir } = await import('$lib/api/tts');

    const ext = (displayName.split('.').pop() || 'wav').toLowerCase();
    const uniqueName = `lib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    let refDir: string;
    try {
      const outputDir = await getOutputDir();
      refDir = outputDir.ref_audio;
    } catch {
      const dataDir = await appDataDir();
      refDir = await join(dataDir, 'ref_audio');
    }

    if (!await exists(refDir)) await mkdir(refDir, { recursive: true });
    const dstPath = await join(refDir, uniqueName);
    const data = await readFile(srcPath);
    await writeFile(dstPath, data);
    return dstPath;
  }

  async function handleImport() {
    if (isImporting) {
      toast.info('已有导入任务在进行');
      return;
    }
    const file = await selectAudioFile();
    if (!file) return;

    isImporting = true;
    importProgress = 0;
    importMessage = '正在拷贝文件…';

    try {
      const localPath = await copyToRefAudio(file.path, file.baseName);
      importProgress = 20;

      let finalPath = localPath;
      if (autoVocalSeparate && vocalAvailable !== false) {
        try {
          const evt = await vocalSeparate(
            { input_path: localPath },
            {
              onProgress: (e) => {
                // 20-95 映射给人声分离
                importProgress = 20 + Math.round(e.progress * 75);
                importMessage = e.message;
              },
            }
          );
          finalPath = evt.output_path;
          importMessage = `人声分离完成 (${evt.method})`;
        } catch (err) {
          toast.warning(`人声分离失败，保留原音频：${err instanceof Error ? err.message : err}`);
        }
      }

      importProgress = 100;
      const tone = IMPORT_TONES[voices.length % IMPORT_TONES.length];
      const newVoice: Voice = {
        name: file.baseName.replace(/\.[^.]+$/, ''),
        meta: `导入 · ${new Date().toLocaleDateString()}`,
        tags: ['导入'],
        pro: false,
        uses: 0,
        tone,
        filePath: finalPath,
      };
      voices = [newVoice, ...voices];
      selected = newVoice;
      toast.success(`已导入「${newVoice.name}」`);
    } catch (err) {
      toast.warning(`导入失败：${err instanceof Error ? err.message : err}`);
    } finally {
      setTimeout(() => {
        isImporting = false;
        importProgress = 0;
        importMessage = '';
      }, 1200);
    }
  }
</script>

<div class="library-page">
  <aside class="library-sidebar">
    <button type="button" class="import-btn" onclick={handleImport} disabled={isImporting}>
      <Icon name="plus" size={16} color="var(--color-primary)" />
      <span>{isImporting ? '导入中…' : '导入样音'}</span>
    </button>

    <label class="vocal-toggle" class:disabled={vocalAvailable === false}>
      <input
        type="checkbox"
        bind:checked={autoVocalSeparate}
        disabled={vocalAvailable === false || isImporting}
      />
      <span class="toggle-text">
        <span class="toggle-label">自动人声分离</span>
        <span class="toggle-hint">
          {#if vocalAvailable === null}检测能力中…
          {:else if vocalAvailable === false}后端不可用
          {:else}{vocalMethod} 算法可用{/if}
        </span>
      </span>
    </label>

    {#if isImporting}
      <div class="import-progress" role="status">
        <div class="import-progress-bar">
          <div class="import-progress-fill" style="width:{importProgress}%"></div>
        </div>
        <span>{importMessage || '处理中…'} · {importProgress}%</span>
      </div>
    {/if}

    <nav class="library-nav">
      {#each categories as [label, count, icon], i (label)}
        <button type="button" class:active={i === 0}>
          <Icon name={icon} size={15} color="currentColor" />
          <span>{label}</span>
          <em>{count}</em>
        </button>
      {/each}
    </nav>

    <div class="group-title">分类</div>
    <nav class="library-nav compact">
      {#each voiceTypes as [label, count, icon] (label)}
        <button type="button">
          <Icon name={icon} size={14} color="currentColor" />
          <span>{label}</span>
          <em>{count}</em>
        </button>
      {/each}
    </nav>

    <div class="group-title">我的标签</div>
    <div class="tag-cloud">
      {#each tags as tag, i (tag)}
        <button type="button" style="--tag-i:{i}">{tag}</button>
      {/each}
    </div>
  </aside>

  <main class="library-main">
    <header class="toolbar">
      <div class="search-box">
        <Icon name="search" size={16} color="var(--color-text-tertiary)" />
        <input placeholder="搜索声音、风格、标签…" />
      </div>
      <select><option>按热度</option><option>按最近使用</option></select>
      <div class="view-toggle">
        <button class="active"><Icon name="appstore" size={15} color="currentColor" /></button>
        <button><Icon name="bars" size={15} color="currentColor" /></button>
      </div>
      <select><option>语言</option></select>
      <select><option>性别</option></select>
      <select><option>时长</option></select>
      <button type="button" class="secondary" onclick={handleImport} disabled={isImporting}>{isImporting ? '导入中…' : '导入'}</button>
    </header>

    <section class="voice-grid">
      {#each voices as voice (voice.name)}
        <button
          type="button"
          class="voice-card"
          class:selected={selected.name === voice.name}
          onclick={() => (selected = voice)}
        >
          <div class="cover {voice.tone}">
            <div class="wave">
              {#each Array(22) as _, i (i)}
                <span style="height:{20 + ((i * 17) % 52)}%"></span>
              {/each}
            </div>
            <em>{voice.pro ? 'PRO' : 'NEW'}</em>
          </div>
          <div class="voice-body">
            <h3>{voice.name}</h3>
            <p>{voice.meta}</p>
            <div class="voice-tags">
              {#each voice.tags as tag (tag)}
                <span>{tag}</span>
              {/each}
            </div>
            <footer>
              <span class="play-dot"><Icon name="play-fill" size={14} color="#fff" /></span>
              <span>00:00:12</span>
              <span class="uses">已用 {voice.uses} 次</span>
              <Icon name="heart" size={15} color="var(--color-text-tertiary)" />
            </footer>
          </div>
        </button>
      {/each}
    </section>

    <footer class="library-status">
      <div>当前筛选：<span>语言：全部</span><span>性别：全部</span><span>时长：全部</span></div>
      <strong>共 1,258 个样音</strong>
      <div class="pager"><button>‹</button><button class="active">1</button><button>2</button><button>3</button><button>…</button><button>63</button><button>›</button></div>
    </footer>
  </main>

  <aside class="detail-panel">
    <div class="detail-head">
      <div class="detail-cover {selected.tone}">
        <Icon name="sound-fill" size={38} color="#fff" />
      </div>
      <div>
        <h2>{selected.name}<span>{selected.pro ? 'PRO' : 'NEW'}</span></h2>
        <p>{selected.meta}</p>
      </div>
    </div>
    <p class="detail-desc">温暖磁性的声音质感，适合纪录片、广告、影视旁白与有声书，情感表达细腻，层次稳定。</p>
    <div class="detail-meta">
      <span>采样率 24kHz</span>
      <span>时长 12s</span>
      <span>格式 WAV</span>
    </div>
    <div class="preview-player">
      <button type="button"><Icon name="play-fill" size={18} color="#fff" /></button>
      <div class="preview-wave">
        {#each Array(28) as _, i (i)}
          <span style="height:{18 + ((i * 13) % 50)}%"></span>
        {/each}
      </div>
      <span>00:00 / 00:12</span>
    </div>
    <button type="button" class="apply-btn" onclick={handleApply}>应用到配音</button>
    <button type="button" class="similar-btn" onclick={() => toast.info('相似样音检索开发中')}>查看相似样音 →</button>
    <div class="detail-foot">
      <span>被使用 {selected.uses} 次</span>
      <span>最近一次 2 小时前</span>
    </div>
  </aside>
</div>

<style>
  .library-page {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 220px minmax(0, 1fr) 320px;
    background-color: var(--color-bg-container);
    overflow: hidden;
  }

  .library-sidebar,
  .detail-panel {
    border-right: 1px solid var(--color-border-secondary);
    background-color: var(--color-bg-container);
    padding: var(--spacing-md);
    overflow-y: auto;
  }

  .detail-panel {
    border-right: none;
    border-left: 1px solid var(--color-border-secondary);
  }

  .import-btn {
    width: 100%;
    height: 44px;
    border: 1px dashed var(--color-primary);
    border-radius: var(--border-radius);
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
    color: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    cursor: pointer;
    margin-bottom: var(--spacing-sm);
  }

  .import-btn:disabled,
  .toolbar .secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .vocal-toggle {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    cursor: pointer;
    margin-bottom: var(--spacing-md);
    transition: border-color var(--transition-duration) var(--transition-timing);
  }

  .vocal-toggle:hover {
    border-color: color-mix(in srgb, var(--color-primary) 35%, var(--color-border-secondary));
  }

  .vocal-toggle input[type="checkbox"] {
    margin-top: 2px;
    accent-color: var(--color-primary);
  }

  .vocal-toggle.disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .toggle-label {
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }

  .toggle-hint {
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  .import-progress {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-md);
    border-radius: var(--border-radius-sm);
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  .import-progress-bar {
    height: 4px;
    border-radius: 2px;
    background-color: color-mix(in srgb, var(--color-border) 70%, transparent);
    overflow: hidden;
  }

  .import-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, white 30%));
    border-radius: 2px;
    transition: width 0.15s ease;
  }

  .library-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .library-nav button {
    height: 34px;
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: 0 var(--spacing-sm);
    border: none;
    border-radius: var(--border-radius);
    background: transparent;
    color: var(--color-text-secondary);
    cursor: pointer;
    font-size: var(--font-size-sm);
  }

  .library-nav button:hover,
  .library-nav button.active {
    background-color: var(--color-bg-spotlight);
    color: var(--color-primary);
  }

  .library-nav span { flex: 1; text-align: left; }
  .library-nav em {
    font-style: normal;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    border-radius: 999px;
    padding: 1px 6px;
    font-size: 11px;
  }

  .group-title {
    margin: var(--spacing-md) 0 var(--spacing-xs);
    color: var(--color-text-tertiary);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .tag-cloud button {
    border: none;
    border-radius: var(--border-radius-sm);
    padding: 4px 8px;
    color: #fff;
    background: color-mix(in srgb, var(--color-primary) calc(42% + var(--tag-i) * 7%), var(--color-bg-spotlight));
    cursor: pointer;
    font-size: 11px;
  }

  .library-main {
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: var(--spacing-md);
    gap: var(--spacing-md);
  }

  .toolbar {
    display: flex;
    gap: var(--spacing-sm);
    align-items: center;
    flex-shrink: 0;
  }

  .search-box {
    flex: 1;
    height: 36px;
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-sm);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
  }

  .search-box input {
    flex: 1;
    border: none;
    background: transparent;
    outline: none;
    color: var(--color-text);
  }

  select,
  .secondary {
    height: 36px;
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    color: var(--color-text-secondary);
    border-radius: var(--border-radius);
    padding: 0 var(--spacing-sm);
  }

  .view-toggle {
    display: flex;
    gap: 2px;
    padding: 2px;
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
  }

  .view-toggle button {
    width: 30px;
    height: 30px;
    border: none;
    border-radius: var(--border-radius-sm);
    background: transparent;
    color: var(--color-text-tertiary);
  }

  .view-toggle button.active {
    color: #fff;
    background: var(--color-primary);
  }

  .voice-grid {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(3, minmax(180px, 1fr));
    gap: var(--spacing-md);
    align-content: start;
  }

  .voice-card {
    padding: 0;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    background-color: var(--color-bg-elevated);
    overflow: hidden;
    text-align: left;
    cursor: pointer;
    color: var(--color-text);
  }

  .voice-card:hover,
  .voice-card.selected {
    border-color: var(--color-primary);
  }

  .cover,
  .detail-cover {
    position: relative;
    background: var(--color-primary);
  }
  .cover { height: 96px; overflow: hidden; }
  .cover.blue, .detail-cover.blue { background: linear-gradient(135deg, #1f4f99, #3b6eaf); }
  .cover.purple, .detail-cover.purple { background: linear-gradient(135deg, #4b2a78, #7a4cc2); }
  .cover.pink, .detail-cover.pink { background: linear-gradient(135deg, #78304d, #c65b78); }
  .cover.orange, .detail-cover.orange { background: linear-gradient(135deg, #7b4a1f, #c07a35); }
  .cover.green, .detail-cover.green { background: linear-gradient(135deg, #285f3a, #60a874); }
  .cover.cyan, .detail-cover.cyan { background: linear-gradient(135deg, #1d6170, #44a4ba); }

  .wave,
  .preview-wave {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    opacity: 0.7;
  }

  .wave span,
  .preview-wave span {
    width: 3px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.75);
  }

  .cover em {
    position: absolute;
    top: 8px;
    right: 8px;
    font-style: normal;
    color: #1a1a1a;
    background: #d4a44a;
    border-radius: var(--border-radius-sm);
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 700;
  }

  .voice-body {
    padding: var(--spacing-md);
  }

  .voice-body h3,
  .detail-head h2 {
    margin: 0;
    color: var(--color-text);
    font-size: var(--font-size-lg);
  }

  .voice-body p,
  .detail-head p,
  .detail-desc {
    margin: 4px 0 0;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    line-height: 1.5;
  }

  .voice-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin: var(--spacing-sm) 0;
  }

  .voice-tags span {
    font-size: 10px;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    border-radius: var(--border-radius-sm);
    padding: 2px 6px;
  }

  .voice-body footer {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    color: var(--color-text-tertiary);
    font-size: 11px;
  }

  .play-dot {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .uses {
    margin-left: auto;
  }

  .library-status {
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    border-top: 1px solid var(--color-border-secondary);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }
  .library-status div:first-child { flex: 1; display: flex; gap: var(--spacing-sm); }
  .library-status span {
    color: var(--color-text-secondary);
    background: var(--color-bg-base);
    padding: 3px 8px;
    border-radius: var(--border-radius-sm);
  }
  .library-status strong { color: var(--color-text-secondary); font-weight: 400; }
  .pager { display: flex; gap: 4px; }
  .pager button {
    min-width: 24px;
    height: 24px;
    border: none;
    border-radius: var(--border-radius-sm);
    color: var(--color-text-tertiary);
    background: var(--color-bg-base);
  }
  .pager button.active { color: #fff; background: var(--color-primary); }

  .detail-head {
    display: flex;
    gap: var(--spacing-md);
    align-items: center;
  }

  .detail-cover {
    width: 80px;
    height: 80px;
    border-radius: var(--border-radius-lg);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .detail-head h2 {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .detail-head h2 span {
    color: #1a1a1a;
    background: #d4a44a;
    border-radius: var(--border-radius-sm);
    font-size: 10px;
    padding: 2px 6px;
  }

  .detail-desc {
    margin: var(--spacing-lg) 0;
  }

  .detail-meta {
    display: flex;
    flex-direction: column;
    gap: 8px;
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
    padding-bottom: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .preview-player {
    margin: var(--spacing-lg) 0;
    display: grid;
    grid-template-columns: 34px 1fr 70px;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .preview-player button {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    border: none;
    background: var(--color-primary);
  }

  .preview-wave {
    height: 34px;
    justify-content: flex-start;
  }

  .preview-wave span {
    background: var(--color-primary);
  }

  .preview-player > span {
    color: var(--color-text-tertiary);
    font-size: 11px;
  }

  .apply-btn {
    width: 100%;
    height: 44px;
    border: none;
    border-radius: var(--border-radius);
    background: var(--color-primary);
    color: #fff;
    font-size: var(--font-size);
    cursor: pointer;
  }

  .similar-btn {
    width: 100%;
    margin: var(--spacing-md) 0;
    border: none;
    background: transparent;
    color: var(--color-primary);
    cursor: pointer;
  }

  .detail-foot {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    color: var(--color-text-tertiary);
    font-size: 11px;
  }
</style>
