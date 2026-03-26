<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  let audioPreviewEl: HTMLAudioElement | undefined = $state();
  let audioDuration = $state('--:--');
  let audioFormat = $state('--');
  let isDragging = $state(false);
  let isPlaying = $state(false);
  let currentTime = $state(0);
  let duration = $state(0);

  // 来源选择：upload = 上传本地样音, preset = 选择预置样音
  let sourceType = $state<'upload' | 'preset'>('upload');

  // 分类数据
  const categories = [
    { id: 'male', name: '男声', icon: 'user', color: '#3B82F6' },
    { id: 'female', name: '女声', icon: 'user', color: '#EC4899' },
    { id: 'movie', name: '影视', icon: 'play-circle', color: '#8B5CF6' },
    { id: 'emotion', name: '情感', icon: 'heart', color: '#EF4444' },
    { id: 'narration', name: '旁白', icon: 'mic', color: '#10B981' },
    { id: 'favorite', name: '收藏', icon: 'star', color: '#F59E0B' },
  ];

  // 最近使用数据（模拟）
  const recentVoices = [
    { id: '1', name: '男声沉稳', usageCount: 3 },
    { id: '2', name: '女声温柔', usageCount: 1 },
  ];

  function onSourceChange(type: 'upload' | 'preset') {
    sourceType = type;
  }

  function handleCategoryClick(categoryId: string) {
    toast.info(`进入${categories.find(c => c.id === categoryId)?.name}分类`);
  }

  function handleRecentVoiceClick(voiceName: string) {
    dubbing.setVoice('preset', voiceName, null);
    toast.success(`已选择：${voiceName}`);
  }

  function handleAudioMeta() {
    if (audioPreviewEl && audioPreviewEl.duration) {
      const d = audioPreviewEl.duration;
      duration = d;
      const m = Math.floor(d / 60);
      const s = Math.floor(d % 60);
      audioDuration = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    const name = dubbing.voiceName?.toLowerCase() ?? '';
    if (name.endsWith('.wav')) audioFormat = 'WAV';
    else if (name.endsWith('.mp3')) audioFormat = 'MP3';
    else if (name.endsWith('.flac')) audioFormat = 'FLAC';
    else audioFormat = '音频';
  }

  function handleTimeUpdate() {
    if (audioPreviewEl) {
      currentTime = audioPreviewEl.currentTime;
    }
  }

  function togglePlay() {
    if (audioPreviewEl) {
      if (isPlaying) {
        audioPreviewEl.pause();
      } else {
        audioPreviewEl.play();
      }
      isPlaying = !isPlaying;
    }
  }

  function handleEnded() {
    isPlaying = false;
    currentTime = 0;
  }

  function formatTime(time: number): string {
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  function handleSeek(e: Event) {
    const target = e.target as HTMLInputElement;
    const time = parseFloat(target.value);
    if (audioPreviewEl) {
      audioPreviewEl.currentTime = time;
      currentTime = time;
    }
  }

  function handleUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.wav,.mp3,.flac';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        loadSample(file);
      }
    };
    input.click();
  }

  function loadSample(file: File) {
    const url = URL.createObjectURL(file);
    dubbing.setVoice('uploaded', file.name, url);
    toast.info('💡 为获得最佳效果，建议使用剪映等专业工具分离出纯净人声后再上传');
  }

  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.name.match(/\.(wav|mp3|flac)$/i)) {
        loadSample(file);
      } else {
        toast.warning('请上传音频文件（.wav, .mp3, .flac）');
      }
    }
  }

  function handleRecord() {
    toast.info('录音功能（倒计时 + 波形预览）开发中');
  }

  function handlePresetLibrary() {
    toast.info('样音库选择弹窗开发中');
  }

  function clearSample() {
    dubbing.setVoice(null, '默认音色', null);
    isPlaying = false;
    currentTime = 0;
    duration = 0;
  }

  let progressPercent = $derived(duration > 0 ? (currentTime / duration) * 100 : 0);
</script>

<div class="ref-audio-panel">
  <!-- 来源选择 - 胶囊式分段选择器 -->
  <div class="source-selector" role="tablist" aria-label="样音来源">
    <button
      type="button"
      role="tab"
      class="source-tab"
      class:active={sourceType === 'upload'}
      onclick={() => onSourceChange('upload')}
    >
      <Icon name="upload" size={14} color={sourceType === 'upload' ? '#fff' : 'var(--color-text-secondary)'} />
      <span>上传本地样音</span>
    </button>
    <button
      type="button"
      role="tab"
      class="source-tab"
      class:active={sourceType === 'preset'}
      onclick={() => onSourceChange('preset')}
    >
      <Icon name="library" size={14} color={sourceType === 'preset' ? '#fff' : 'var(--color-text-secondary)'} />
      <span>选择预置样音</span>
    </button>
  </div>

  {#if sourceType === 'upload'}
    <!-- 上传区域 -->
    <div class="upload-section">
      {#if !dubbing.voiceAudioUrl}
        <!-- 拖放上传区域 -->
        <div
          class="drop-area"
          class:dragging={isDragging}
          ondragenter={handleDragEnter}
          ondragleave={handleDragLeave}
          ondragover={handleDragOver}
          ondrop={handleDrop}
          onclick={handleUpload}
          role="button"
          tabindex="0"
        >
          <div class="drop-icon">
            <Icon name="upload" size={40} color={isDragging ? 'var(--color-primary)' : 'var(--color-text-tertiary)'} />
          </div>
          <div class="drop-text">点击上传或拖拽文件到此处</div>
          <div class="drop-hint">WAV / MP3 / FLAC · 建议 3-15 秒</div>
        </div>

        <!-- 或 -->
        <div class="or-divider"><span>或</span></div>

        <!-- 录制按钮 -->
        <button type="button" class="record-btn" onclick={handleRecord}>
          <Icon name="microphone" size={16} color="var(--color-text-secondary)" />
          <span>录制样音</span>
        </button>
      {:else}
        <!-- 已上传文件卡片 -->
        <div class="audio-file-card">
          <div class="audio-file-main">
            <div class="audio-wave-icon">
              <Icon name="sound" size={20} color="var(--color-primary)" />
            </div>
            <div class="audio-file-info">
              <span class="audio-file-name">{dubbing.voiceName}</span>
              <span class="audio-file-meta">{audioFormat} · {audioDuration}</span>
            </div>
          </div>
          <button type="button" class="audio-file-remove" onclick={clearSample} title="移除">
            <Icon name="delete" size={16} color="var(--color-text-tertiary)" />
          </button>
        </div>

        <!-- 自定义音频播放器 -->
        <div class="custom-player">
          <button type="button" class="play-btn" onclick={togglePlay}>
            <Icon name={isPlaying ? 'pause' : 'play'} size={16} color="#fff" />
          </button>
          <div class="progress-bar">
            <input
              type="range"
              class="progress-input"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              oninput={handleSeek}
            />
            <div class="progress-track">
              <div class="progress-fill" style="width: {progressPercent}%"></div>
            </div>
          </div>
          <span class="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
        </div>

        <!-- 隐藏的原生音频元素 -->
        <audio
          src={dubbing.voiceAudioUrl}
          preload="metadata"
          bind:this={audioPreviewEl}
          onloadedmetadata={handleAudioMeta}
          ontimeupdate={handleTimeUpdate}
          onended={handleEnded}
          class="hidden-audio"
        >
          <track kind="captions" />
        </audio>
      {/if}
    </div>
  {:else}
    <!-- 预置样音区域 -->
    <div class="preset-section">
      <!-- 搜索框 -->
      <div class="preset-search">
        <Icon name="search" size={14} color="var(--color-text-tertiary)" />
        <input type="text" placeholder="搜索样音..." class="preset-search-input" />
      </div>

      <!-- 快速分类 -->
      <div class="category-section">
        <div class="section-title">
          <span>快速分类</span>
        </div>
        <div class="category-grid">
          {#each categories as cat (cat.id)}
            <button
              type="button"
              class="category-btn"
              onclick={() => handleCategoryClick(cat.id)}
            >
              <span>{cat.name}</span>
            </button>
          {/each}
        </div>
      </div>

      <!-- 最近使用 -->
      <div class="recent-section">
        <div class="section-title">
          <Icon name="clock" size={12} color="var(--color-text-tertiary)" />
          <span>最近使用</span>
        </div>
        <div class="recent-list">
          {#each recentVoices as voice (voice.id)}
            <button
              type="button"
              class="recent-item"
              onclick={() => handleRecentVoiceClick(voice.name)}
            >
              <div class="recent-left">
                <Icon name="play" size={14} color="var(--color-text-tertiary)" />
                <span class="recent-name">{voice.name}</span>
              </div>
              <span class="recent-count">使用{voice.usageCount}次</span>
              <Icon name="right" size={12} color="var(--color-text-disabled)" />
            </button>
          {/each}
        </div>
      </div>

      <!-- 浏览全部按钮 -->
      <button type="button" class="browse-all-btn" onclick={handlePresetLibrary}>
        <Icon name="library" size={16} color="#fff" />
        <span>浏览全部样音</span>
        <Icon name="right" size={14} color="rgba(255,255,255,0.7)" />
      </button>
    </div>
  {/if}
</div>

<style>
  .ref-audio-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  /* 来源选择 - 胶囊式分段选择器 */
  .source-selector {
    display: flex;
    gap: 4px;
    padding: 4px;
    background-color: var(--color-bg-base);
    border-radius: var(--border-radius);
  }

  .source-tab {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 32px;
    padding: 0 var(--spacing-sm);
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    transition: all var(--transition-duration) var(--transition-timing);
  }

  .source-tab:hover {
    color: var(--color-text);
  }

  .source-tab.active {
    background-color: var(--color-primary);
    color: #fff;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  /* 上传区域 */
  .upload-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  .drop-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    min-height: 120px;
    padding: var(--spacing-md);
    background: var(--color-bg-base);
    border: 2px dashed var(--color-border);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .drop-area:hover,
  .drop-area.dragging {
    background: rgba(59, 130, 246, 0.08);
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }

  .drop-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s ease;
  }

  .drop-area:hover .drop-icon {
    transform: translateY(-2px);
  }

  .drop-text {
    font-size: var(--font-size);
    font-weight: 500;
    color: var(--color-text);
  }

  .drop-hint {
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
  }

  .or-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    position: relative;
  }

  .or-divider::before,
  .or-divider::after {
    content: '';
    flex: 1;
    height: 1px;
    background-color: var(--color-border-secondary);
    margin: 0 var(--spacing-sm);
  }

  /* 录制按钮 */
  .record-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    height: 36px;
    padding: 0 var(--spacing-md);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    transition: all var(--transition-duration) var(--transition-timing);
  }

  .record-btn:hover {
    border-color: var(--color-primary);
    color: var(--color-text);
    background-color: var(--color-bg-elevated);
  }

  /* 音频文件卡片 - 横向布局 */
  .audio-file-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    transition: border-color var(--transition-duration) var(--transition-timing);
  }

  .audio-file-card:hover {
    border-color: var(--color-border);
  }

  .audio-file-main {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .audio-wave-icon {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(59, 130, 246, 0.1);
    border-radius: var(--border-radius-sm);
    flex-shrink: 0;
  }

  .audio-file-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .audio-file-name {
    font-size: var(--font-size-sm);
    color: var(--color-text);
    font-weight: 500;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .audio-file-meta {
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  .audio-file-remove {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
  }

  .audio-file-remove:hover {
    background-color: rgba(239, 68, 68, 0.1);
  }

  .audio-file-remove:hover :global(svg) {
    color: var(--color-error) !important;
  }

  /* 自定义音频播放器 */
  .custom-player {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
  }

  .play-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-primary);
    border: none;
    border-radius: 50%;
    cursor: pointer;
    flex-shrink: 0;
    transition: all var(--transition-duration) var(--transition-timing);
  }

  .play-btn:hover {
    background-color: var(--color-primary-hover);
    transform: scale(1.05);
  }

  .progress-bar {
    flex: 1;
    position: relative;
    height: 20px;
    display: flex;
    align-items: center;
  }

  .progress-input {
    position: absolute;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
    z-index: 2;
  }

  .progress-track {
    width: 100%;
    height: 4px;
    background-color: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background-color: var(--color-primary);
    border-radius: 2px;
    transition: width 0.1s linear;
  }

  .time-display {
    font-size: 11px;
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    min-width: 80px;
    text-align: right;
  }

  .hidden-audio {
    display: none;
  }

  /* 预置样音区域 */
  .preset-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
  }

  /* 搜索框 */
  .preset-search {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    padding: 0 var(--spacing-sm);
    height: 40px;
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    transition: border-color var(--transition-duration) var(--transition-timing);
  }

  .preset-search:focus-within {
    border-color: var(--color-primary);
  }

  .preset-search-input {
    flex: 1;
    background: transparent;
    border: none;
    color: var(--color-text);
    font-size: var(--font-size);
    outline: none;
  }

  .preset-search-input::placeholder {
    color: var(--color-text-disabled);
  }

  /* 分区标题 */
  .section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 500;
    color: var(--color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: var(--spacing-xs);
  }

  /* 分类网格 */
  .category-section {
    display: flex;
    flex-direction: column;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-sm);
  }

  .category-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 32px;
    padding: 0 var(--spacing-sm);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    transition: all var(--transition-duration) var(--transition-timing);
  }

  .category-btn:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-primary);
    color: var(--color-text);
  }

  /* 最近使用 */
  .recent-section {
    display: flex;
    flex-direction: column;
  }

  .recent-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .recent-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
  }

  .recent-item:hover {
    background: var(--color-bg-elevated);
    border-color: var(--color-border);
  }

  .recent-left {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    flex: 1;
  }

  .recent-name {
    font-size: var(--font-size-sm);
    color: var(--color-text);
  }

  .recent-count {
    font-size: 11px;
    color: var(--color-text-disabled);
  }

  /* 浏览全部按钮 */
  .browse-all-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    height: 44px;
    padding: 0 var(--spacing-lg);
    background-color: var(--color-primary);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    font-size: var(--font-size);
    font-weight: 500;
    color: #fff;
    transition: all var(--transition-duration) var(--transition-timing);
    margin-top: var(--spacing-xs);
  }

  .browse-all-btn:hover {
    background-color: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }

  .browse-all-btn:active {
    background-color: var(--color-primary-active);
    transform: translateY(0);
  }
</style>
