<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Switch from '$lib/components/ui/Switch.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { appSettings } from '$lib/stores/settings.svelte';
  import { transcribe, translateSubtitle, optimizeTiming, type SubtitleFormat } from '$lib/api/tts';

  interface SubtitleRow {
    index: number;
    start: string;
    end: string;
    text: string;
    confidence: number;
    role: string;
  }

  interface RecognizeJob {
    name: string;
    status: string;
    progress: number;
    time: string;
    output_path?: string;
  }

  const DEFAULT_SUBTITLES: SubtitleRow[] = [
    { index: 1, start: '00:00:01,240', end: '00:00:04,820', text: '如果这扇门真的通往过去，那我们必须在天亮前做出选择。', confidence: 98, role: '旁白' },
    { index: 2, start: '00:00:05,120', end: '00:00:08,900', text: '我不怕改变历史，我只怕你再也回不来了。', confidence: 96, role: '旁白' },
    { index: 3, start: '00:00:09,300', end: '00:00:14,680', text: '走廊尽头的钟声敲响，所有人的呼吸都停在了同一秒。', confidence: 94, role: '旁白' },
  ];

  let jobs = $state<RecognizeJob[]>([]);
  let subtitles = $state<SubtitleRow[]>(DEFAULT_SUBTITLES);
  let activeSubtitle = $state<SubtitleRow>(DEFAULT_SUBTITLES[0]);
  let activeJobIndex = $state(-1);
  let currentMediaName = $state('示例字幕');
  let currentMediaPath = $state<string | null>(null);
  let currentSubtitlePath = $state<string | null>(null);

  let exportFormat = $state<SubtitleFormat>('srt');
  let isTranscribing = $state(false);
  let transcribeProgress = $state(0);
  let transcribeMessage = $state('');

  let languageLabel = $state('中文普通话');
  let needWordTimestamp = $state(false);

  function langCode(label: string): string {
    if (label === '英语') return 'en';
    if (label === '粤语') return 'yue';
    return 'zh';
  }

  function nowTime(): string {
    const d = new Date();
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }

  function parseSrt(content: string): SubtitleRow[] {
    const rows: SubtitleRow[] = [];
    const blocks = content.replace(/\r\n/g, '\n').split(/\n\n+/);
    let idx = 1;
    const tsRe = /(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})/;
    for (const block of blocks) {
      const lines = block.split('\n').filter((l) => l.trim());
      if (lines.length < 2) continue;
      const tsLine = lines.find((l) => tsRe.test(l));
      if (!tsLine) continue;
      const match = tsLine.match(tsRe);
      if (!match) continue;
      const start = match[1];
      const end = match[2];
      const textLines = lines.slice(lines.indexOf(tsLine) + 1);
      const text = textLines.join('\n').trim();
      if (!text) continue;
      rows.push({ index: idx++, start, end, text, confidence: 95, role: '识别' });
    }
    return rows;
  }

  async function selectMediaFile(): Promise<string | null> {
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
      return selected as string;
    } catch (err) {
      toast.warning(`选择文件失败：${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async function runTranscribe(inputPath: string): Promise<void> {
    isTranscribing = true;
    transcribeProgress = 0;
    transcribeMessage = '准备识别…';
    currentMediaPath = inputPath;
    currentMediaName = inputPath.split(/[\\/]/).pop() || '未命名';

    const job: RecognizeJob = {
      name: currentMediaName,
      status: '识别中',
      progress: 0,
      time: nowTime(),
    };
    jobs = [job, ...jobs];
    activeJobIndex = 0;

    try {
      const result = await transcribe(
        {
          input_path: inputPath,
          asr_model: 'BIJIAN',
          language: langCode(languageLabel),
          need_word_timestamp: needWordTimestamp,
          output_format: exportFormat,
        },
        {
          onProgress: (e) => {
            transcribeProgress = Math.round(e.progress * 100);
            transcribeMessage = e.message;
            jobs[0] = { ...jobs[0], progress: transcribeProgress, status: e.message };
            jobs = jobs;
          },
        }
      );

      currentSubtitlePath = result.output_path;
      jobs[0] = { ...jobs[0], progress: 100, status: '识别完成', output_path: result.output_path };
      jobs = jobs;

      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      try {
        const content = await readTextFile(result.output_path);
        const rows = parseSrt(content);
        if (rows.length > 0) {
          subtitles = rows;
          activeSubtitle = rows[0];
        }
      } catch {
        // 非 srt 格式或读取失败：保留默认显示
      }

      toast.success(`字幕识别完成，共 ${result.segment_count} 条`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      jobs[0] = { ...jobs[0], status: `失败：${msg.slice(0, 30)}`, progress: 0 };
      jobs = jobs;
      toast.warning(`识别失败：${msg}`);
    } finally {
      isTranscribing = false;
    }
  }

  async function handleImport() {
    const file = await selectMediaFile();
    if (file) await runTranscribe(file);
  }

  async function handleRecognize() {
    if (isTranscribing) {
      toast.info('已有识别任务在进行');
      return;
    }
    if (currentMediaPath) {
      await runTranscribe(currentMediaPath);
    } else {
      await handleImport();
    }
  }

  async function handleExport() {
    if (!currentSubtitlePath) {
      toast.info('请先识别字幕');
      return;
    }
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { readFile, writeFile } = await import('@tauri-apps/plugin-fs');

      const ext = exportFormat;
      const defaultName = `${currentMediaName.replace(/\.[^.]+$/, '')}.${ext}`;
      const target = await save({
        defaultPath: defaultName,
        filters: [
          { name: ext.toUpperCase(), extensions: [ext] },
        ],
      });
      if (!target) return;

      const data = await readFile(currentSubtitlePath);
      await writeFile(target as string, data);
      toast.success(`已导出 ${defaultName}`);
    } catch (err) {
      toast.warning(`导出失败：${err instanceof Error ? err.message : err}`);
    }
  }

  // ---- 翻译 ----
  const TRANSLATE_LANGUAGES = [
    { code: 'en', label: '英语' },
    { code: 'zh', label: '简体中文' },
    { code: 'ja', label: '日语' },
    { code: 'ko', label: '韩语' },
    { code: 'fr', label: '法语' },
    { code: 'de', label: '德语' },
    { code: 'es', label: '西班牙语' },
    { code: 'ru', label: '俄语' },
  ];
  let showTranslateModal = $state(false);
  let translateTargetLang = $state('en');
  let isTranslating = $state(false);
  let translatedText = $state('');

  async function handleTranslate() {
    if (subtitles.length === 0) {
      toast.info('暂无字幕内容可翻译');
      return;
    }
    showTranslateModal = true;
    translatedText = '';
  }

  async function runTranslate() {
    const { llm } = appSettings.settings;
    if (!llm.apiBaseUrl || !llm.apiKey) {
      toast.warning('请先在设置页面配置 LLM API 地址和密钥');
      return;
    }

    const sourceText = subtitles.map((s) => `${s.index}\n${s.start} --> ${s.end}\n${s.text}`).join('\n\n');
    isTranslating = true;

    try {
      const result = await translateSubtitle({
        text: sourceText,
        target_language: translateTargetLang,
        api_base_url: llm.apiBaseUrl,
        api_key: llm.apiKey,
        model: llm.model || undefined,
      });
      translatedText = result.translated_text;
      toast.success('翻译完成');
    } catch (err) {
      toast.warning(`翻译失败：${err instanceof Error ? err.message : err}`);
    } finally {
      isTranslating = false;
    }
  }

  async function exportTranslation() {
    if (!translatedText) return;
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const lang = TRANSLATE_LANGUAGES.find((l) => l.code === translateTargetLang);
      const defaultName = `${currentMediaName.replace(/\.[^.]+$/, '')}_${lang?.code ?? 'translated'}.srt`;
      const target = await save({ defaultPath: defaultName, filters: [{ name: 'SRT', extensions: ['srt'] }] });
      if (!target) return;
      await writeTextFile(target as string, translatedText);
      toast.success(`已导出翻译字幕`);
    } catch (err) {
      toast.warning(`导出失败：${err instanceof Error ? err.message : err}`);
    }
  }

  // ---- 时间轴优化 ----
  let isOptimizing = $state(false);

  function timeToMs(ts: string): number {
    const m = ts.match(/(\d{2}):(\d{2}):(\d{2})[,.](\d{3})/);
    if (!m) return 0;
    return (+m[1] * 3600 + +m[2] * 60 + +m[3]) * 1000 + +m[4];
  }

  function msToTime(ms: number): string {
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const mil = ms % 1000;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(mil).padStart(3, '0')}`;
  }

  async function handleOptimize() {
    if (subtitles.length === 0) {
      toast.info('暂无字幕可优化');
      return;
    }

    isOptimizing = true;
    try {
      const segments = subtitles.map((s) => ({
        start_ms: timeToMs(s.start),
        end_ms: timeToMs(s.end),
        text: s.text,
      }));

      const result = await optimizeTiming({ segments });

      if (result.fixes === 0) {
        toast.success('时间轴无需优化');
      } else {
        subtitles = result.segments.map((seg, i) => ({
          index: i + 1,
          start: msToTime(seg.start_ms),
          end: msToTime(seg.end_ms),
          text: seg.text,
          confidence: subtitles[i]?.confidence ?? 95,
          role: subtitles[i]?.role ?? '识别',
        }));
        activeSubtitle = subtitles[0];
        toast.success(`已修复 ${result.fixes} 处时间轴问题`);
      }
    } catch (err) {
      toast.warning(`优化失败：${err instanceof Error ? err.message : err}`);
    } finally {
      isOptimizing = false;
    }
  }

  function selectFormat(fmt: SubtitleFormat) {
    exportFormat = fmt;
  }
</script>

<div class="subtitle-page">
  <aside class="asr-panel">
    <button type="button" class="upload-card" onclick={handleImport} disabled={isTranscribing}>
      <Icon name="cloud-upload" size={28} color="var(--color-primary)" />
      <strong>导入音视频</strong>
      <span>支持 MP4 / MOV / MKV / WAV / MP3 / M4A</span>
    </button>

    <section class="recognize-card">
      <h2>ASR 识别 · 必剪</h2>
      <label>识别语言<select bind:value={languageLabel}><option>中文普通话</option><option>粤语</option><option>英语</option></select></label>
      <label class="switch-row">词级时间戳<Switch bind:checked={needWordTimestamp} size="sm" /></label>
      <label>导出格式
        <select bind:value={exportFormat}>
          <option value="srt">SRT</option>
          <option value="vtt">VTT</option>
          <option value="ass">ASS</option>
          <option value="json">JSON</option>
        </select>
      </label>
      {#if isTranscribing}
        <div class="recognize-progress">
          <div class="recognize-progress-bar">
            <div class="recognize-progress-fill" style="width:{transcribeProgress}%"></div>
          </div>
          <span>{transcribeMessage || '识别中…'} · {transcribeProgress}%</span>
        </div>
      {/if}
      <Button variant="primary" size="sm" block loading={isTranscribing} onclick={handleRecognize}>
        {isTranscribing ? '识别中…' : '开始识别'}
      </Button>
    </section>

    <section class="job-list">
      <h2>识别任务</h2>
      {#if jobs.length === 0}
        <div class="job-empty">尚无识别任务，点击上方"导入音视频"开始</div>
      {:else}
        {#each jobs as job, i (job.name + i)}
          <button type="button" class:active={activeJobIndex === i} onclick={() => activeJobIndex = i}>
            <div><strong>{job.name}</strong><span>{job.status} · {job.time}</span></div>
            <em>{job.progress}%</em>
            <i style="width:{job.progress}%"></i>
          </button>
        {/each}
      {/if}
    </section>
  </aside>

  <main class="subtitle-main">
    <header class="subtitle-toolbar">
      <div>
        <h1>字幕编辑器</h1>
        <p>{currentMediaName} · {subtitles.length} 条字幕 · 输出 {exportFormat.toUpperCase()}</p>
      </div>
      <div class="toolbar-actions">
        <Button variant="default" size="sm" prefixIcon="sync" onclick={handleRecognize} disabled={isTranscribing}>重新识别</Button>
        <Button variant="default" size="sm" prefixIcon="translation" onclick={handleTranslate}>翻译</Button>
        <Button variant="default" size="sm" onclick={handleOptimize} loading={isOptimizing}>时间轴优化</Button>
        <Button variant="primary" size="sm" onclick={handleExport} disabled={!currentSubtitlePath}>导出字幕</Button>
      </div>
    </header>

    <section class="video-preview">
      <div class="screen">
        <Icon name="video-camera" size={40} color="var(--color-primary)" />
        <p>视频预览区域</p>
        <strong>如果这扇门真的通往过去，那我们必须在天亮前做出选择。</strong>
      </div>
      <div class="transport">
        <button><Icon name="step-backward" size={16} color="currentColor" /></button>
        <button class="play"><Icon name="play-fill" size={18} color="#fff" /></button>
        <button><Icon name="step-forward" size={16} color="currentColor" /></button>
        <span>00:00:01.240</span>
        <div><i style="width:18%"></i></div>
        <span>00:23:45.000</span>
      </div>
    </section>

    <section class="subtitle-list">
      <div class="subtitle-head"><span>#</span><span>入点</span><span>出点</span><span>角色</span><span>字幕文本</span><span>置信度</span></div>
      {#each subtitles as item (item.index)}
        <button type="button" class="subtitle-row" class:active={activeSubtitle.index === item.index} onclick={() => (activeSubtitle = item)}>
          <span>{item.index}</span>
          <time>{item.start}</time>
          <time>{item.end}</time>
          <em>{item.role}</em>
          <strong>{item.text}</strong>
          <small>{item.confidence}%</small>
        </button>
      {/each}
    </section>
  </main>

  <aside class="editor-panel">
    <header>
      <h2>字幕条目 #{activeSubtitle.index}</h2>
      <Button variant="default" size="sm" onclick={() => toast.info('已定位到当前字幕')}>定位</Button>
    </header>

    <section class="edit-card">
      <label>入点<input value={activeSubtitle.start} /></label>
      <label>出点<input value={activeSubtitle.end} /></label>
      <label>角色<select value={activeSubtitle.role}><option>{activeSubtitle.role}</option><option>林澈</option><option>苏晚</option><option>旁白</option></select></label>
      <label class="full">字幕内容<textarea value={activeSubtitle.text}></textarea></label>
      <div class="edit-actions">
        <Button variant="default" size="sm">上一条</Button>
        <Button variant="primary" size="sm">保存修改</Button>
        <Button variant="default" size="sm">下一条</Button>
      </div>
    </section>

    <section class="style-card">
      <h3>字幕样式</h3>
      <label>字体<select><option>思源黑体</option><option>微软雅黑</option></select></label>
      <label>字号<input type="number" value="42" /></label>
      <label>描边<input type="number" value="2" /></label>
      <label>位置<select><option>底部居中</option><option>顶部居中</option></select></label>
      <div class="style-preview">字幕预览</div>
    </section>

    <section class="export-card">
      <h3>导出格式</h3>
      <button class:active={exportFormat === 'srt'} onclick={() => selectFormat('srt')}>SRT</button>
      <button class:active={exportFormat === 'ass'} onclick={() => selectFormat('ass')}>ASS</button>
      <button class:active={exportFormat === 'vtt'} onclick={() => selectFormat('vtt')}>VTT</button>
      <button class:active={exportFormat === 'json'} onclick={() => selectFormat('json')}>JSON</button>
    </section>
  </aside>
</div>

<Modal bind:open={showTranslateModal} title="字幕翻译" size="lg">
  <div class="translate-body">
    <div class="translate-options">
      <label>
        目标语言
        <select bind:value={translateTargetLang}>
          {#each TRANSLATE_LANGUAGES as lang (lang.code)}
            <option value={lang.code}>{lang.label}</option>
          {/each}
        </select>
      </label>
      <Button variant="primary" size="sm" onclick={runTranslate} loading={isTranslating}>
        {isTranslating ? '翻译中…' : '开始翻译'}
      </Button>
    </div>
    {#if translatedText}
      <div class="translate-result">
        <header>
          <span>翻译结果</span>
          <Button variant="default" size="sm" onclick={exportTranslation}>导出翻译</Button>
        </header>
        <pre>{translatedText}</pre>
      </div>
    {/if}
  </div>
  {#snippet footer()}
    <Button variant="default" onclick={() => (showTranslateModal = false)}>关闭</Button>
  {/snippet}
</Modal>

<style>
  .subtitle-page {
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: clamp(180px, 20vw, 240px) minmax(0, 1fr) clamp(220px, 24vw, 300px);
    gap: var(--spacing-sm);
    padding: clamp(8px, 1.2vw, 15px);
    background: var(--color-bg-container);
    overflow: hidden;
  }

  @media (max-width: 1000px) {
    .subtitle-page {
      grid-template-columns: minmax(0, 1fr) clamp(200px, 24vw, 260px);
    }
    .asr-panel {
      display: none;
    }
  }

  @media (max-width: 800px) {
    .subtitle-page {
      grid-template-columns: 1fr;
      overflow-y: auto;
    }
    .editor-panel {
      max-height: 320px;
      overflow-y: auto;
    }
  }

  button {
    cursor: pointer;
    font-family: inherit;
  }

  .asr-panel {
    padding: var(--spacing-md);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .editor-panel {
    padding: var(--spacing-md);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .upload-card {
    width: 100%;
    height: 128px;
    border: 1px dashed var(--color-primary);
    border-radius: var(--border-radius-lg);
    background: color-mix(in srgb, var(--color-primary) 8%, transparent);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 6px;
    color: var(--color-text);
  }

  .upload-card span,
  .subtitle-toolbar p,
  .job-list span {
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .recognize-card,
  .job-list,
  .edit-card,
  .style-card,
  .export-card {
    margin-top: var(--spacing-md);
    padding: var(--spacing-md);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    background: var(--color-bg-elevated);
  }

  h2,
  h3 {
    margin: 0 0 var(--spacing-md);
    color: var(--color-text);
    font-size: var(--font-size);
  }

  .recognize-card label,
  .edit-card label,
  .style-card label {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
    align-items: center;
    gap: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  input,
  select,
  textarea {
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    background: var(--color-bg-base);
    color: var(--color-text);
    font-family: inherit;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;
  }

  input,
  select {
    height: 30px;
    padding: 0 8px;
  }

  .switch-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .job-list button {
    position: relative;
    width: 100%;
    min-height: 58px;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background: var(--color-bg-base);
    color: var(--color-text);
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--spacing-sm);
    text-align: left;
    overflow: hidden;
  }

  .job-list button.active {
    border-color: var(--color-primary);
  }

  .job-empty {
    padding: var(--spacing-md);
    font-size: 11px;
    color: var(--color-text-tertiary);
    text-align: center;
    border: 1px dashed var(--color-border-secondary);
    border-radius: var(--border-radius);
  }

  .recognize-progress {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: var(--spacing-sm);
    margin-bottom: var(--spacing-sm);
    border-radius: var(--border-radius-sm);
    background-color: color-mix(in srgb, var(--color-primary) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  .recognize-progress-bar {
    height: 4px;
    border-radius: 2px;
    background-color: color-mix(in srgb, var(--color-border) 70%, transparent);
    overflow: hidden;
  }

  .recognize-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, white 30%));
    border-radius: 2px;
    transition: width 0.2s ease;
  }

  .upload-card:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .job-list div {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .job-list em {
    color: var(--color-primary);
    font-style: normal;
    font-size: var(--font-size-sm);
  }

  .job-list i {
    position: absolute;
    left: 0;
    bottom: 0;
    height: 3px;
    background: var(--color-primary);
  }

  .subtitle-main {
    min-width: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
  }

  .subtitle-toolbar {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-md);
  }

  .subtitle-toolbar h1 {
    margin: 0;
    color: var(--color-text);
    font-size: 20px;
  }

  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .export-card button {
    height: 32px;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background: var(--color-bg-base);
    color: var(--color-text-secondary);
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 0 var(--spacing-sm);
    cursor: pointer;
  }

  .video-preview {
    padding: var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .screen {
    height: clamp(140px, 22vw, 220px);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    background: radial-gradient(circle at 50% 20%, color-mix(in srgb, var(--color-primary) 20%, transparent), transparent 38%), var(--color-bg-base);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    color: var(--color-text-tertiary);
  }

  .screen strong {
    margin-top: auto;
    margin-bottom: var(--spacing-lg);
    padding: 6px 18px;
    color: #fff;
    background: rgba(0,0,0,0.55);
    border-radius: var(--border-radius-sm);
  }

  .transport {
    height: 42px;
    display: grid;
    grid-template-columns: 32px 38px 32px minmax(60px, 90px) 1fr minmax(60px, 100px);
    align-items: center;
    gap: var(--spacing-xs);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-sm);
  }

  .transport button {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 50%;
    background: var(--color-bg-elevated);
    color: var(--color-text-secondary);
  }

  .transport .play {
    width: 38px;
    height: 38px;
    background: var(--color-primary);
  }

  .transport div {
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .transport i {
    display: block;
    height: 100%;
    background: var(--color-primary);
  }

  .subtitle-list {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: var(--spacing-sm);
  }

  .subtitle-head,
  .subtitle-row {
    display: grid;
    grid-template-columns: 36px minmax(80px, 110px) minmax(80px, 110px) 60px minmax(160px, 1fr) 60px;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
  }

  .subtitle-head {
    height: 34px;
    color: var(--color-text-tertiary);
    border-bottom: 1px solid var(--color-border-secondary);
  }

  .subtitle-row {
    width: 100%;
    min-height: 54px;
    border: none;
    border-bottom: 1px solid var(--color-border-secondary);
    background: transparent;
    color: var(--color-text-secondary);
    text-align: left;
  }

  .subtitle-row.active,
  .subtitle-row:hover {
    background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  }

  .subtitle-row strong {
    color: var(--color-text);
    font-weight: 400;
  }

  .subtitle-row em,
  .subtitle-row small {
    justify-self: start;
    padding: 2px 7px;
    border-radius: var(--border-radius-sm);
    font-style: normal;
    color: var(--color-primary);
    background: color-mix(in srgb, var(--color-primary) 14%, transparent);
  }

  .subtitle-row small {
    color: var(--color-success);
    background: color-mix(in srgb, var(--color-success) 14%, transparent);
  }

  .editor-panel header {
    height: 34px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .editor-panel header h2 {
    margin: 0;
  }

  .edit-card .full {
    display: flex;
    flex-direction: column;
    align-items: stretch;
  }

  textarea {
    min-height: 104px;
    padding: var(--spacing-sm);
    resize: vertical;
  }

  .edit-actions {
    display: flex;
    gap: var(--spacing-sm);
  }

  .edit-actions :global(.ui-btn) {
    flex: 1;
    justify-content: center;
  }

  .style-preview {
    height: 64px;
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border-secondary);
    background: #111;
    color: #fff;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding-bottom: 12px;
    text-shadow: 0 0 4px #000;
  }

  .export-card {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--spacing-sm);
  }

  .export-card h3 {
    grid-column: 1 / -1;
  }

  .export-card button.active {
    border-color: var(--color-primary);
    color: #fff;
    background: var(--color-primary);
  }

  .translate-body {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  .translate-options {
    display: flex;
    align-items: flex-end;
    gap: var(--spacing-md);
  }

  .translate-options label {
    display: flex;
    flex-direction: column;
    gap: 4px;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .translate-options select {
    height: 32px;
    min-width: 140px;
  }

  .translate-result {
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    overflow: hidden;
  }

  .translate-result header {
    height: 36px;
    padding: 0 var(--spacing-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color-bg-base);
    border-bottom: 1px solid var(--color-border-secondary);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }

  .translate-result pre {
    max-height: 320px;
    padding: var(--spacing-md);
    margin: 0;
    overflow-y: auto;
    font-size: var(--font-size-sm);
    color: var(--color-text);
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.6;
  }
</style>
