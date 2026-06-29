<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '$lib/icons/Icon.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Switch from '$lib/components/ui/Switch.svelte';
  import Select from '$lib/components/ui/Select.svelte';
  import MiniPlayer from '$lib/components/ui/MiniPlayer.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { vocalSeparate, vocalSeparateInfo, listPresets, type PresetVoice } from '$lib/api/tts';
  import { convertFileSrc } from '@tauri-apps/api/core';

  interface Voice {
    id: string;
    name: string;
    description: string;
    gender: string;
    genderLabel: string;
    language: string;
    tag: string;
    tags: string[];
    premium: boolean;
    filePath?: string;
    cover?: string;
    duration?: number;
    source?: string;
    searchText: string;
    coverBroken?: boolean;
  }

  const PAGE_SIZE = 15;
  const SORT_OPTIONS = [
    { value: 'name', label: '按名称' },
    { value: 'premium', label: '按精品' },
    { value: 'duration', label: '按时长' },
  ];
  const TONE_MAP: Record<string, string> = { '男': 'male', 'Male': 'male', '女': 'female', 'Female': 'female' };

  function normalizeGender(g = '') { return g === '男' || g === 'Male' ? '男' : g === '女' || g === 'Female' ? '女' : g || '未知'; }
  function voiceTone(g = '') { return TONE_MAP[g] ?? 'neutral'; }
  function fmtDur(s: number | undefined) { if (!s) return '--'; const m = Math.floor(s / 60); return `${m}:${Math.round(s % 60).toString().padStart(2, '0')}`; }

  function presetToVoice(p: PresetVoice): Voice {
    const tag = p.display_tag || p.tags?.[0] || '样音';
    const tags = p.tags ?? [];
    const cover = p.cover ? (/^[a-zA-Z]:[\\/]/.test(p.cover) || p.cover.startsWith('http') || p.cover.startsWith('blob:') ? p.cover : `${_presetBaseDir}\\${p.cover}`) : undefined;
    return { id: p.id || p.name, name: p.name, description: p.description || `${p.language} · ${p.display_tag}`, gender: p.gender, genderLabel: normalizeGender(p.gender), language: p.language || '中文', tag, tags, premium: p.is_premium, filePath: p.file_path, cover, duration: p.duration, source: p.source, searchText: `${p.name} ${p.description || ''} ${tag} ${tags.join(' ')}`.toLowerCase() };
  }

  const FALLBACK: Voice[] = [
    { id: 'male-narration', name: '磁性男声', description: '沉稳叙事，适合纪录片', gender: '男', genderLabel: '男', language: '中文', tag: '叙事', tags: ['磁性', '沉稳'], premium: true, searchText: '磁性男声 沉稳叙事 纪录片 叙事 磁性 沉稳' },
    { id: 'female-warm', name: '温暖女声', description: '温柔亲和，适合情感文案', gender: '女', genderLabel: '女', language: '中文', tag: '抒情', tags: ['温暖', '治愈'], premium: false, searchText: '温暖女声 温柔亲和 情感文案 抒情 温暖 治愈' },
    { id: 'boy-energy', name: '活力少年', description: '清亮活泼，适合短视频', gender: '男', genderLabel: '男', language: '中文', tag: '活泼', tags: ['青春', '明亮'], premium: false, searchText: '活力少年 清亮活泼 短视频 活泼 青春 明亮' },
    { id: 'male-calm', name: '沉稳男声', description: '低沉稳定，适合有声书', gender: '男', genderLabel: '男', language: '中文', tag: '旁白', tags: ['沉稳', '旁白'], premium: true, searchText: '沉稳男声 低沉稳定 有声书 沉稳 旁白' },
    { id: 'female-heal', name: '治愈女声', description: '柔和舒缓，适合助眠', gender: '女', genderLabel: '女', language: '中文', tag: '治愈', tags: ['温柔', '舒缓'], premium: false, searchText: '治愈女声 柔和舒缓 助眠 治愈 温柔 舒缓' },
    { id: 'cantonese-m', name: '粤语男声', description: '粤语叙事，适合方言内容', gender: '男', genderLabel: '男', language: '粤语', tag: '粤语', tags: ['粤语', '磁性'], premium: true, searchText: '粤语男声 粤语叙事 方言 粤语 磁性' },
  ];

  let _presetBaseDir = $state('');

  /* ── state ── */
  let voices = $state<Voice[]>([]);
  let loading = $state(true);
  let search = $state('');
  let genderFilter = $state('全部');
  let languageFilter = $state('全部');
  let sortBy = $state('name');
  let currentPage = $state(1);
  let selectedVoiceId = $state('');
  let playingVoiceId = $state('');

  let audioEl: HTMLAudioElement | undefined = $state();
  let audioSrc = $state('');
  let audioPlaying = $state(false);

  let autoVocalSeparate = $state(true);
  let vocalAvailable = $state<boolean | null>(null);
  let vocalMethod = $state('检测中');
  let isImporting = $state(false);
  let importProgress = $state(0);
  let importMessage = $state('');

  /* ── derived ── */
  let genderTabs = $derived(['全部', ...new Set(voices.map(v => v.genderLabel).filter(Boolean))]);
  let langOptions = $derived(['全部', ...new Set(voices.map(v => v.language).filter(Boolean))]);
  let langSelectOptions = $derived(langOptions.map((o) => ({ value: o, label: o === '全部' ? '全部语言' : o })));

  let filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    let list = voices.filter(v => {
      if (q && !v.searchText.includes(q)) return false;
      if (genderFilter !== '全部' && v.genderLabel !== genderFilter) return false;
      if (languageFilter !== '全部' && v.language !== languageFilter) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'premium') return Number(b.premium) - Number(a.premium) || a.name.localeCompare(b.name, 'zh-CN');
      if (sortBy === 'duration') return (b.duration ?? 0) - (a.duration ?? 0);
      return a.name.localeCompare(b.name, 'zh-CN');
    });
    return list;
  });

  let totalPages = $derived(Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)));
  let pageItems = $derived(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE));
  let sel = $derived(voices.find(v => v.id === selectedVoiceId) ?? pageItems[0] ?? voices[0]);
  let premiumN = $derived(voices.filter(v => v.premium).length);
  let userN = $derived(voices.filter(v => v.source === 'user').length);

  let pages = $derived.by(() => {
    const r: (number | '...')[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) r.push(i); }
    else {
      r.push(1);
      if (currentPage > 3) r.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) r.push(i);
      if (currentPage < totalPages - 2) r.push('...');
      r.push(totalPages);
    }
    return r;
  });

  $effect(() => { if (currentPage > totalPages) currentPage = totalPages; if (currentPage < 1) currentPage = 1; });

  onMount(() => { void loadVoices(); setTimeout(() => void loadVocalInfo(), 0); });

  async function loadVoices() {
    loading = true;
    try {
      const local = await loadLocal();
      voices = local.length > 0 ? local : FALLBACK;
      selectedVoiceId = voices[0]?.id ?? '';
      currentPage = 1;
    } finally { loading = false; }
    void refreshFromBackend();
  }

  async function refreshFromBackend() {
    try {
      const r = await listPresets();
      if (!r.presets.length) return;
      const nv = r.presets.map(presetToVoice);
      voices = nv;
      if (!nv.some(v => v.id === selectedVoiceId)) selectedVoiceId = nv[0]?.id ?? '';
    } catch {}
  }

  async function loadLocal(): Promise<Voice[]> {
    try {
      const { readTextFile, exists } = await import('@tauri-apps/plugin-fs');
      const { join, appDataDir, resourceDir } = await import('@tauri-apps/api/path');
      const devPresetDir = import.meta.env.DEV ? 'E:\\Exploitation\\MaruAudio\\MaruAudio_V3\\backend\\outputs\\preset' : '';
      const candidateDirs = [devPresetDir, await join(await appDataDir(), 'preset'), await join(await appDataDir(), 'outputs', 'preset')].filter(Boolean);
      let dirs: string[];
      try { dirs = [await join(await resourceDir(), 'preset'), ...candidateDirs]; } catch { dirs = candidateDirs; }
      let pd = '', mp = '';
      for (const d of dirs) { const c = await join(d, 'metadata.json'); if (await exists(c)) { pd = d; mp = c; break; } }
      if (!pd) return [];
      _presetBaseDir = pd;
      const data = JSON.parse(await readTextFile(mp)) as Array<{ name: string; gender: string; language: string; display_tag: string; tags: string[]; is_premium: boolean; file_path: string; description: string; duration?: number; cover?: string }>;
      return Promise.all(data.map(async p => {
        const fn = p.file_path.split(/[/\\]/).pop()!;
        const tag = p.display_tag || p.tags?.[0] || '样音';
        const tags = p.tags ?? [];
        return { id: p.name, name: p.name, description: p.description || `${p.language} · ${p.display_tag}`, gender: p.gender, genderLabel: normalizeGender(p.gender), language: p.language || '中文', tag, tags, premium: p.is_premium, filePath: await join(pd, fn), cover: p.cover ? await join(pd, 'covers', p.cover.split(/[/\\]/).pop()!) : undefined, duration: p.duration, searchText: `${p.name} ${p.description || ''} ${tag} ${tags.join(' ')}`.toLowerCase() };
      }));
    } catch { return []; }
  }

  async function loadVocalInfo() {
    try { const i = await vocalSeparateInfo(); vocalAvailable = i.available; vocalMethod = i.available ? `${i.method}` : '不可用'; }
    catch { vocalAvailable = false; vocalMethod = '不可达'; }
  }

  function resetPage() { currentPage = 1; }
  function goPage(p: number) { currentPage = Math.max(1, Math.min(totalPages, p)); }

  function fileSrc(v: Voice | undefined) { if (!v?.filePath) return ''; return v.filePath.startsWith('http') || v.filePath.startsWith('blob:') ? v.filePath : convertFileSrc(v.filePath); }
  function imgSrc(p: string | undefined) { if (!p) return ''; if (/^[a-zA-Z]:/.test(p.replace(/\\/g, '/'))) return convertFileSrc(p); return p.startsWith('http') || p.startsWith('blob:') ? p : convertFileSrc(p); }
  function markBroken(id: string) { voices = voices.map(v => v.id === id ? { ...v, coverBroken: true } : v); }

  function togglePlay(v: Voice) {
    const src = fileSrc(v); if (!src) { toast.info('暂无音频'); return; }
    selectedVoiceId = v.id;
    if (playingVoiceId === v.id && audioPlaying) { audioEl?.pause(); audioPlaying = false; return; }
    playingVoiceId = v.id; audioSrc = src;
    requestAnimationFrame(() => { void audioEl?.play(); audioPlaying = true; });
  }

  function handleApply(v = sel) {
    if (!v?.filePath) { toast.info('暂无音频'); return; }
    dubbing.setVoice(v.id, v.name, v.filePath);
    toast.success(`已将「${v.name}」应用到配音页`);
  }

  async function handleImport() {
    if (isImporting) return;
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const s = await open({ multiple: false, directory: false, filters: [{ name: '音视频', extensions: ['mp4', 'mov', 'mkv', 'avi', 'webm', 'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'] }] });
      if (!s || Array.isArray(s)) return;
      const path = s as string, baseName = path.split(/[\\/]/).pop() || '未命名';
      isImporting = true; importProgress = 0; importMessage = '拷贝中…';
      const { readFile, writeFile, mkdir, exists } = await import('@tauri-apps/plugin-fs');
      const { join, appDataDir } = await import('@tauri-apps/api/path');
      const { getOutputDir } = await import('$lib/api/tts');
      const ext = (baseName.split('.').pop() || 'wav').toLowerCase();
      const uname = `lib_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
      let refDir: string;
      try { refDir = (await getOutputDir()).ref_audio; } catch { refDir = await join(await appDataDir(), 'ref_audio'); }
      if (!await exists(refDir)) await mkdir(refDir, { recursive: true });
      const dst = await join(refDir, uname);
      await writeFile(dst, await readFile(path));
      importProgress = 20;
      let finalPath = dst;
      if (autoVocalSeparate && vocalAvailable !== false) {
        try {
          const evt = await vocalSeparate({ input_path: dst }, { onProgress: e => { importProgress = 20 + Math.round(e.progress * 75); importMessage = e.message; } });
          finalPath = evt.output_path;
        } catch (err) { toast.warning(`人声分离失败：${err instanceof Error ? err.message : err}`); }
      }
      const nv: Voice = { id: `imp-${Date.now()}`, name: baseName.replace(/\.[^.]+$/, ''), description: `导入 · ${new Date().toLocaleDateString()}`, gender: '', genderLabel: '未知', language: '中文', tag: '导入', tags: ['导入'], premium: false, filePath: finalPath, source: 'user', searchText: `${baseName} 导入`.toLowerCase() };
      voices = [nv, ...voices]; selectedVoiceId = nv.id; currentPage = 1; importProgress = 100;
      toast.success(`已导入「${nv.name}」`);
    } catch (e) { toast.warning(`导入失败：${e instanceof Error ? e.message : e}`); }
    finally { setTimeout(() => { isImporting = false; importProgress = 0; importMessage = ''; }, 600); }
  }
</script>

{#if audioSrc}
  <audio bind:this={audioEl} src={audioSrc} preload="metadata" onended={() => { audioPlaying = false; playingVoiceId = ''; }} style="display:none"></audio>
{/if}

<div class="res-page">
  <!-- ─── 左侧主列表 ─── -->
  <div class="list-col">
    <!-- 顶栏 -->
    <div class="list-toolbar">
      <div class="tb-search">
        <Icon name="search" size={14} color="var(--color-text-tertiary)" />
        <input bind:value={search} oninput={resetPage} placeholder="搜索音色…" />
        {#if search}<button class="tb-clear" onclick={() => { search = ''; resetPage(); }}><Icon name="close" size={10} color="var(--color-text-tertiary)" /></button>{/if}
      </div>
      <div class="tb-tabs">
        {#each genderTabs as t (t)}
          <button class:on={genderFilter === t} onclick={() => { genderFilter = t; resetPage(); }}>{t}</button>
        {/each}
      </div>
      <Select size="sm" ariaLabel="语言筛选" bind:value={languageFilter} options={langSelectOptions} onchange={resetPage} />
      <Select size="sm" ariaLabel="排序方式" bind:value={sortBy} options={SORT_OPTIONS} />
      <span class="tb-count">{filtered.length}</span>
    </div>

    <!-- 表头 -->
    <div class="list-head">
      <span class="col-idx">#</span>
      <span class="col-name">音色</span>
      <span class="col-gender">性别</span>
      <span class="col-tag">标签</span>
      <span class="col-lang">语言</span>
      <span class="col-dur">时长</span>
      <span class="col-act"></span>
    </div>

    <!-- 列表体 -->
    <div class="list-body">
      {#if loading}
        {#each Array(8) as _, i (i)}
          <div class="row skel"><span class="col-idx"></span><span class="col-name"><span class="skel-bar w80"></span><span class="skel-bar w120"></span></span></div>
        {/each}
      {:else if pageItems.length === 0}
        <div class="list-empty">
          <Icon name="sound" size={36} color="var(--color-text-quaternary)" />
          <strong>暂无匹配音色</strong>
          <span>换个关键词或上传新样音</span>
        </div>
      {:else}
        {#each pageItems as v, i (v.id)}
          <div
            class="row"
            class:active={sel?.id === v.id}
            class:playing={playingVoiceId === v.id && audioPlaying}
            role="button" tabindex="0"
            onclick={() => { selectedVoiceId = v.id; }}
            onkeydown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectedVoiceId = v.id; } }}
            ondblclick={() => togglePlay(v)}
          >
            <span class="col-idx">{(currentPage - 1) * PAGE_SIZE + i + 1}</span>

            <span class="col-name">
              <span class="av {voiceTone(v.gender)}">
                {#if v.cover && !v.coverBroken}
                  <img src={imgSrc(v.cover)} alt="" loading="lazy" onerror={() => markBroken(v.id)} />
                {:else}
                  {v.name.slice(0, 1)}
                {/if}
              </span>
              <span class="name-text">
                <span class="name-primary">
                  {v.name}
                  {#if v.premium}<em class="badge-gold">精品</em>{/if}
                </span>
                <span class="name-desc">{v.description}</span>
              </span>
            </span>

            <span class="col-gender"><em class="pill {voiceTone(v.gender)}">{v.genderLabel}</em></span>
            <span class="col-tag">{v.tag}</span>
            <span class="col-lang">{v.language}</span>
            <span class="col-dur">{fmtDur(v.duration)}</span>

            <span class="col-act">
              <button class="act-play" onclick={e => { e.stopPropagation(); togglePlay(v); }} aria-label="播放">
                <Icon name={playingVoiceId === v.id && audioPlaying ? 'pause-fill' : 'play-fill'} size={14} color="currentColor" />
              </button>
              <button class="act-apply" onclick={e => { e.stopPropagation(); handleApply(v); }} aria-label="应用">
                <Icon name="check" size={12} color="currentColor" />
              </button>
            </span>
          </div>
        {/each}
      {/if}
    </div>

    <!-- 底栏 -->
    <div class="list-footer">
      <span>{filtered.length} 个音色</span>
      <div class="flex-1"></div>
      <div class="pager">
        <button disabled={currentPage <= 1} onclick={() => goPage(currentPage - 1)}>‹</button>
        {#each pages as p (typeof p === 'number' ? p : `e${Math.random()}`)}
          {#if p === '...'}<span class="pg-dot">…</span>
          {:else}<button class:on={currentPage === p} onclick={() => goPage(p as number)}>{p}</button>{/if}
        {/each}
        <button disabled={currentPage >= totalPages} onclick={() => goPage(currentPage + 1)}>›</button>
      </div>
    </div>
  </div>

  <!-- ─── 右侧详情 ─── -->
  <aside class="detail-col">
    {#if sel}
      <div class="d-cover {voiceTone(sel.gender)}">
        {#if sel.cover && !sel.coverBroken}
          <img src={imgSrc(sel.cover)} alt="" loading="lazy" onerror={() => markBroken(sel.id)} />
        {:else}
          <span class="d-letter">{sel.name.slice(0, 1)}</span>
        {/if}
        {#if sel.premium}<em class="d-premium"><Icon name="crown" size={10} color="#1a1a1a" /> 精品</em>{/if}
      </div>

      <div class="d-head">
        <h2>{sel.name}</h2>
        <p>{sel.description}</p>
      </div>

      <div class="d-tags">
        <em class="pill {voiceTone(sel.gender)}">{sel.genderLabel}</em>
        <em class="pill">{sel.language}</em>
        <em class="pill">{sel.tag}</em>
        {#each sel.tags as t (t)}<em class="pill">{t}</em>{/each}
      </div>

      {#if sel.filePath}
        <div class="d-player"><MiniPlayer src={fileSrc(sel)} label={sel.name} height={36} /></div>
      {/if}

      <div class="d-meta">
        {#if sel.duration}<div class="dm"><span>时长</span><span>{fmtDur(sel.duration)}</span></div>{/if}
        <div class="dm"><span>来源</span><span>{sel.source === 'user' ? '用户导入' : '预置音色'}</span></div>
      </div>

      <Button variant="primary" size="md" block onclick={() => handleApply(sel)}>应用到配音</Button>
    {:else}
      <div class="d-empty"><Icon name="sound" size={40} color="var(--color-text-quaternary)" /><span>选择音色查看详情</span></div>
    {/if}

    <!-- 底部固定 -->
    <div class="d-bottom">
      <div class="d-stats">
        <div class="ds"><strong>{voices.length}</strong><span>全部</span></div>
        <div class="ds gold"><strong>{premiumN}</strong><span>精品</span></div>
        <div class="ds"><strong>{userN}</strong><span>导入</span></div>
      </div>
      <Button variant="primary" size="md" block prefixIcon="upload" onclick={handleImport} loading={isImporting}>上传样音</Button>
      {#if isImporting}
        <div class="imp"><span>{importMessage} {importProgress}%</span><div class="imp-track"><i style="width:{importProgress}%"></i></div></div>
      {/if}
      <div class="d-vocal" class:off={vocalAvailable === false}>
        <Switch bind:checked={autoVocalSeparate} size="sm" disabled={vocalAvailable === false || isImporting} />
        <div><strong>人声分离</strong><span>{vocalAvailable === null ? '检测中…' : vocalMethod}</span></div>
      </div>
    </div>
  </aside>
</div>

<style>
  /* ===== Page ===== */
  .res-page {
    flex: 1; min-height: 0; padding: 15px;
    display: grid;
    grid-template-columns: minmax(0, 1fr) clamp(240px, 24vw, 300px);
    gap: var(--spacing-sm);
    background: var(--color-bg-container);
    overflow: hidden;
  }

  .flex-1 { flex: 1; }

  /* ===== Left list column ===== */
  .list-col {
    min-height: 0;
    display: flex; flex-direction: column;
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    overflow: hidden;
  }

  /* -- Toolbar -- */
  .list-toolbar {
    display: flex; align-items: center; gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    border-bottom: 1px solid var(--color-border-secondary);
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .tb-search {
    width: clamp(160px, 20vw, 240px);
    height: 32px;
    display: flex; align-items: center; gap: 6px;
    padding: 0 var(--spacing-sm);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    transition: border-color var(--transition-duration) var(--transition-timing);
  }
  .tb-search:focus-within { border-color: var(--color-primary); }
  .tb-search input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: var(--color-text); font-size: var(--font-size-sm); }
  .tb-clear { width: 16px; height: 16px; border: none; background: transparent; display: flex; align-items: center; justify-content: center; border-radius: 50%; cursor: pointer; }
  .tb-clear:hover { background: var(--color-hover-bg); }

  .tb-tabs {
    display: flex; gap: 1px;
    background: var(--color-bg-base);
    border-radius: var(--border-radius-sm);
    padding: 2px;
  }
  .tb-tabs button {
    height: 26px; padding: 0 10px;
    border: none; border-radius: 4px;
    background: transparent; color: var(--color-text-tertiary);
    font-size: 12px; cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
  }
  .tb-tabs button:hover { color: var(--color-text-secondary); }
  .tb-tabs button.on { background: var(--color-primary); color: #fff; }

  .tb-count {
    margin-left: auto;
    min-width: 24px; height: 20px;
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0 6px;
    border-radius: var(--border-radius-pill);
    background: color-mix(in srgb, var(--color-primary) 12%, transparent);
    color: var(--color-primary);
    font-size: var(--font-size-xs); font-weight: 600;
  }

  /* -- List head -- */
  .list-head {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) 56px 72px 56px 48px 64px;
    align-items: center;
    height: 34px;
    padding: 0 var(--spacing-md);
    color: var(--color-text-quaternary);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid var(--color-border-secondary);
    flex-shrink: 0;
  }

  /* -- List body -- */
  .list-body {
    flex: 1; min-height: 0;
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .list-empty {
    height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: var(--spacing-sm);
    color: var(--color-text-tertiary);
  }
  .list-empty strong { color: var(--color-text-secondary); }

  /* -- Row -- */
  .row {
    display: grid;
    grid-template-columns: 36px minmax(0, 1fr) 56px 72px 56px 48px 64px;
    align-items: center;
    height: 52px;
    padding: 0 var(--spacing-md);
    cursor: pointer;
    transition: background var(--transition-duration) var(--transition-timing);
  }

  .row:hover { background: var(--color-hover-bg); }
  .row.active { background: var(--color-selected-bg); }
  .row.playing { background: color-mix(in srgb, var(--color-primary) 8%, transparent); }

  .col-idx { color: var(--color-text-quaternary); font-size: 12px; font-variant-numeric: tabular-nums; }
  .row.playing .col-idx { color: var(--color-primary); }

  .col-name { display: flex; align-items: center; gap: var(--spacing-sm); min-width: 0; }

  .av {
    width: 36px; height: 36px; flex-shrink: 0;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 800; font-size: 15px;
    letter-spacing: -0.5px;
    background: linear-gradient(140deg, color-mix(in srgb, var(--color-primary) 60%, #000) 0%, var(--color-primary) 50%, color-mix(in srgb, var(--color-primary) 60%, #fff) 100%);
    overflow: hidden;
    box-shadow:
      0 2px 8px color-mix(in srgb, var(--color-primary) 20%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
    position: relative;
    transition: transform var(--transition-duration) var(--transition-timing),
                box-shadow var(--transition-duration) var(--transition-timing);
  }
  .row:hover .av {
    transform: scale(1.06);
    box-shadow:
      0 4px 12px color-mix(in srgb, var(--color-primary) 28%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  .av::after {
    content: '';
    position: absolute; inset: 0;
    background: radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.12), transparent 60%);
    pointer-events: none;
  }
  .av img { width: 100%; height: 100%; object-fit: cover; position: relative; z-index: 1; }
  .av.female {
    background: linear-gradient(140deg, color-mix(in srgb, var(--color-accent) 60%, #000) 0%, var(--color-accent) 50%, color-mix(in srgb, var(--color-accent) 60%, #fff) 100%);
    box-shadow:
      0 2px 8px color-mix(in srgb, var(--color-accent) 20%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.08);
  }
  .row:hover .av.female {
    box-shadow:
      0 4px 12px color-mix(in srgb, var(--color-accent) 28%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
  }
  .av.neutral {
    background: linear-gradient(140deg, var(--color-bg-base) 0%, var(--color-text-disabled) 50%, var(--color-text-tertiary) 100%);
    box-shadow:
      0 2px 8px color-mix(in srgb, var(--color-text-disabled) 20%, transparent),
      inset 0 1px 0 rgba(255, 255, 255, 0.06);
  }

  .name-text { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
  .name-primary {
    display: flex; align-items: center; gap: 5px;
    font-size: var(--font-size-sm); color: var(--color-text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .row.playing .name-primary { color: var(--color-primary); }
  .name-desc {
    font-size: var(--font-size-xs); color: var(--color-text-tertiary);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .badge-gold {
    display: inline-flex; align-items: center;
    padding: 1px 5px; border-radius: var(--border-radius-pill);
    background: linear-gradient(135deg, #f0d060, #d4a44a);
    color: #1a1a1a; font-size: 9px; font-weight: 700; font-style: normal;
    flex-shrink: 0;
  }

  .col-gender { display: flex; justify-content: center; }
  .col-tag, .col-lang { color: var(--color-text-tertiary); font-size: 12px; text-align: center; }
  .col-dur { color: var(--color-text-quaternary); font-size: 12px; font-family: ui-monospace, Menlo, Consolas, monospace; text-align: center; }

  .pill {
    height: 20px; display: inline-flex; align-items: center;
    padding: 0 7px; border-radius: var(--border-radius-pill);
    font-size: var(--font-size-2xs); font-style: normal; font-weight: 500;
    color: var(--color-text-tertiary); background: var(--color-bg-spotlight);
  }
  .pill.male { color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 12%, transparent); }
  .pill.female { color: var(--color-accent); background: color-mix(in srgb, var(--color-accent) 12%, transparent); }

  .col-act {
    display: flex; align-items: center; justify-content: flex-end; gap: 4px;
    opacity: 0;
    transition: opacity var(--transition-duration) var(--transition-timing);
  }
  .row:hover .col-act, .row.active .col-act, .row.playing .col-act { opacity: 1; }

  .act-play, .act-apply {
    width: 26px; height: 26px;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    background: var(--color-bg-base);
    color: var(--color-text-tertiary);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
  }
  .act-play:hover { border-color: var(--color-primary); color: var(--color-primary); background: color-mix(in srgb, var(--color-primary) 8%, transparent); }
  .act-apply:hover { border-color: var(--color-success); color: var(--color-success); background: color-mix(in srgb, var(--color-success) 8%, transparent); }

  .row.playing .act-play { border-color: var(--color-primary); color: var(--color-primary); }

  /* -- Skeleton -- */
  .skel { pointer-events: none; }
  .skel-bar { display: block; height: 10px; border-radius: 4px; background: linear-gradient(90deg, var(--color-bg-spotlight), color-mix(in srgb, var(--color-bg-spotlight) 60%, white 10%), var(--color-bg-spotlight)); background-size: 200% 100%; animation: shimmer 1.2s ease-in-out infinite; }
  .w80 { width: 80px; }
  .w120 { width: 120px; margin-top: 4px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* -- Footer -- */
  .list-footer {
    display: flex; align-items: center;
    height: 38px;
    padding: 0 var(--spacing-md);
    border-top: 1px solid var(--color-border-secondary);
    color: var(--color-text-quaternary);
    font-size: 12px;
    flex-shrink: 0;
  }

  .pager { display: flex; gap: 2px; }
  .pager button {
    min-width: 26px; height: 26px;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    background: var(--color-bg-base);
    color: var(--color-text-tertiary);
    font-size: var(--font-size-xs); cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
  }
  .pager button:hover:not(:disabled) { border-color: var(--color-primary); color: var(--color-primary); }
  .pager button.on { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
  .pager button:disabled { opacity: 0.3; cursor: not-allowed; }
  .pg-dot { width: 20px; display: inline-flex; align-items: center; justify-content: center; color: var(--color-text-quaternary); font-size: var(--font-size-xs); }

  /* ===== Right detail column ===== */
  .detail-col {
    min-height: 0;
    display: flex; flex-direction: column;
    gap: var(--spacing-sm);
    background: var(--color-bg-elevated);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
    padding: var(--spacing-sm);
    overflow-y: auto;
    scrollbar-width: thin;
    scrollbar-color: var(--color-border) transparent;
  }

  .d-cover {
    width: 100%; aspect-ratio: 1; max-height: 200px;
    border-radius: var(--border-radius);
    overflow: hidden;
    display: flex; align-items: center; justify-content: center;
    background: linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 50%, #000), var(--color-primary));
    position: relative; flex-shrink: 0;
  }
  .d-cover.female { background: linear-gradient(145deg, color-mix(in srgb, var(--color-accent) 50%, #000), var(--color-accent)); }
  .d-cover.neutral { background: linear-gradient(145deg, var(--color-bg-base), var(--color-text-disabled)); }
  .d-cover img { width: 100%; height: 100%; object-fit: cover; }

  .d-letter { font-size: 56px; font-weight: 700; color: rgba(255, 255, 255, 0.3); user-select: none; }

  .d-premium {
    position: absolute; bottom: 8px; left: 8px;
    display: inline-flex; align-items: center; gap: 3px;
    padding: 2px 8px; border-radius: var(--border-radius-pill);
    background: linear-gradient(135deg, #f0d060, #d4a44a);
    color: #1a1a1a; font-size: var(--font-size-2xs); font-weight: 700; font-style: normal;
  }

  .d-head h2 { margin: 0; font-size: var(--font-size-lg); color: var(--color-text); font-weight: 600; }
  .d-head p { margin: 4px 0 0; color: var(--color-text-tertiary); font-size: var(--font-size-sm); line-height: 1.5; }

  .d-tags { display: flex; flex-wrap: wrap; gap: 5px; }

  .d-player { background: var(--color-bg-base); border-radius: var(--border-radius); padding: 4px; }

  .d-meta { display: flex; flex-direction: column; gap: 4px; padding: var(--spacing-xs) var(--spacing-sm); background: var(--color-bg-base); border-radius: var(--border-radius); }
  .dm { display: flex; justify-content: space-between; font-size: var(--font-size-sm); }
  .dm span:first-child { color: var(--color-text-tertiary); }
  .dm span:last-child { color: var(--color-text-secondary); }

  .d-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--spacing-sm); color: var(--color-text-tertiary); font-size: var(--font-size-sm); }

  /* -- Bottom area -- */
  .d-bottom {
    margin-top: auto;
    display: flex; flex-direction: column;
    gap: var(--spacing-sm);
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--color-border-secondary);
    flex-shrink: 0;
  }

  .d-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-xs); }
  .ds { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 4px; background: var(--color-bg-base); border-radius: var(--border-radius-sm); }
  .ds strong { font-size: var(--font-size-sm); color: var(--color-primary); line-height: 1; }
  .ds.gold strong { color: var(--color-warning); }
  .ds span { font-size: var(--font-size-2xs); color: var(--color-text-tertiary); }

  .imp { font-size: var(--font-size-xs); color: var(--color-text-secondary); display: flex; flex-direction: column; gap: 3px; }
  .imp-track { height: 3px; border-radius: var(--border-radius-pill); background: var(--color-bg-base); overflow: hidden; }
  .imp-track i { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--color-primary), var(--color-primary-hover)); transition: width 0.3s ease; }

  .d-vocal { display: flex; align-items: center; gap: var(--spacing-sm); }
  .d-vocal.off { opacity: 0.5; }
  .d-vocal div { display: flex; flex-direction: column; gap: 1px; }
  .d-vocal strong { font-size: 12px; color: var(--color-text); }
  .d-vocal span { font-size: var(--font-size-2xs); color: var(--color-text-tertiary); }

  @media (max-width: 900px) {
    .res-page { grid-template-columns: 1fr; }
    .detail-col { display: none; }
  }
</style>
