<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing, type EmotionMethod, EMOTION_SLIDER_SUM_MAX } from '$lib/stores/dubbing.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  const EMOTION_LABELS: Record<string, string> = {
    happy: '开心',
    angry: '愤怒',
    sad: '悲伤',
    afraid: '害怕',
    disgusted: '厌恶',
    melancholic: '忧郁',
    surprised: '惊讶',
    calm: '平静',
  };

  const EMOTION_ICONS: Record<string, string> = {
    happy: 'smile',
    angry: 'frown',
    sad: 'meh',
    afraid: 'alert-circle',
    disgusted: 'x-circle',
    melancholic: 'cloud-rain',
    surprised: 'zap',
    calm: 'moon',
  };

  /** 情感引擎控制方式 */
  const methods: { id: EmotionMethod; label: string; icon: string }[] = [
    { id: 'slider', label: '情感向量控制', icon: 'sliders' },
    { id: 'text', label: '描述文本控制', icon: 'type' },
    { id: 'audio', label: '情感参考音频', icon: 'mic' },
  ];

  // 情感预设
  const emotionPresets = [
    { name: '平静自然', values: { happy: 0, angry: 0, sad: 0, afraid: 0, disgusted: 0, melancholic: 0, surprised: 0, calm: 0.5 } },
    { name: '开心活泼', values: { happy: 0.6, angry: 0, sad: 0, afraid: 0, disgusted: 0, melancholic: 0, surprised: 0.2, calm: 0 } },
    { name: '温柔关怀', values: { happy: 0.2, angry: 0, sad: 0, afraid: 0, disgusted: 0, melancholic: 0, surprised: 0, calm: 0.6 } },
    { name: '愤怒激动', values: { happy: 0, angry: 0.7, sad: 0, afraid: 0, disgusted: 0.1, melancholic: 0, surprised: 0, calm: 0 } },
    { name: '悲伤低落', values: { happy: 0, angry: 0, sad: 0.5, afraid: 0, disgusted: 0, melancholic: 0.3, surprised: 0, calm: 0 } },
  ];

  let emotionSum = $derived(
    Object.values(dubbing.emotionSliders).reduce((a, b) => a + b, 0)
  );

  // 情感强度可视化计算
  let emotionIntensity = $derived(Math.min(emotionSum / EMOTION_SLIDER_SUM_MAX, 1));

  // 防抖定时器
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  function updateSlider(key: string, value: number) {
    // 立即更新本地显示值（无防抖）
    dubbing.emotionSliders = { ...dubbing.emotionSliders, [key]: value };
  }

  function applyPreset(values: typeof dubbing.emotionSliders) {
    dubbing.emotionSliders = { ...values };
  }

  function resetEmotions() {
    dubbing.emotionSliders = {
      happy: 0, angry: 0, sad: 0, afraid: 0,
      disgusted: 0, melancholic: 0, surprised: 0, calm: 0.5
    };
  }

  async function handleEmotionAudioUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.wav,.mp3,audio/wav,audio/mpeg';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 文件大小限制：50MB
      const MAX_FILE_SIZE = 50 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.warning('音频文件大小不能超过 50MB');
        return;
      }

      try {
        const { writeFile, mkdir, exists } = await import('@tauri-apps/plugin-fs');
        const { join } = await import('@tauri-apps/api/path');
        const { getOutputDir } = await import('$lib/api/tts');

        // 从 TTS Server 获取 output 目录路径
        const outputDir = await getOutputDir();
        const emoDir = outputDir.emo_audio;
        if (!await exists(emoDir)) {
          await mkdir(emoDir, { recursive: true });
        }

        const ext = file.name.split('.').pop() || 'wav';
        const uniqueName = `emo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const filePath = await join(emoDir, uniqueName);

        const arrayBuffer = await file.arrayBuffer();
        await writeFile(filePath, new Uint8Array(arrayBuffer));

        dubbing.emotionAudioPath = filePath;
        toast.success(`已加载情感参考音频: ${file.name}`);
      } catch (error) {
        console.error('情感音频加载失败:', error);
        toast.warning(`加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    };
    input.click();
  }

  function clearEmotionAudio() {
    dubbing.emotionAudioPath = null;
  }
</script>

<div class="emotion-panel">
  <div class="method-selector" role="radiogroup" aria-label="情感输入方式">
    {#each methods as m (m.id)}
      <button
        type="button"
        role="radio"
        aria-checked={dubbing.emotionMethod === m.id}
        class="method-btn"
        class:active={dubbing.emotionMethod === m.id}
        onclick={() => {
          dubbing.emotionMethod = m.id;
        }}
      >
        {m.label}
      </button>
    {/each}
  </div>

  {#if dubbing.emotionMethod === 'slider'}
    <!-- 情感预设 -->
    <div class="presets-section">
      <div class="section-label">快速预设</div>
      <div class="preset-chips">
        {#each emotionPresets as preset}
          <button
            type="button"
            class="preset-chip"
            onclick={() => applyPreset(preset.values)}
          >
            {preset.name}
          </button>
        {/each}
      </div>
    </div>

    <!-- 情感强度可视化 -->
    <div class="intensity-bar">
      <div class="intensity-fill" style="width: {emotionIntensity * 100}%; background: linear-gradient(90deg, var(--color-success), var(--color-warning), var(--color-error));"></div>
    </div>

    <div class="slider-grid">
      {#each Object.entries(EMOTION_LABELS) as [key, label] (key)}
        <div class="emotion-row">
          <div class="emotion-icon-label">
            <Icon name={EMOTION_ICONS[key]} size={12} color="var(--color-text-tertiary)" />
            <span class="emotion-label">{label}</span>
          </div>
          <input
            type="range"
            class="emotion-slider"
            class:active={dubbing.emotionSliders[key as keyof typeof dubbing.emotionSliders] > 0}
            min="0"
            max="1.2"
            step="0.05"
            value={dubbing.emotionSliders[key as keyof typeof dubbing.emotionSliders]}
            oninput={(e) => updateSlider(key, parseFloat((e.target as HTMLInputElement).value))}
          />
          <span class="emotion-value" class:active={dubbing.emotionSliders[key as keyof typeof dubbing.emotionSliders] > 0}>
            {(dubbing.emotionSliders[key as keyof typeof dubbing.emotionSliders] ?? 0).toFixed(2)}
          </span>
        </div>
      {/each}
    </div>

    <div class="emotion-stats">
      <p class="emotion-hint" class:warn={emotionSum > EMOTION_SLIDER_SUM_MAX}>
        <Icon name="info-circle" size={11} color={emotionSum > EMOTION_SLIDER_SUM_MAX ? 'var(--color-warning)' : 'var(--color-text-disabled)'} />
        <span>八维情感向量总和上限 {EMOTION_SLIDER_SUM_MAX}，当前 {emotionSum.toFixed(2)}</span>
      </p>
      <div class="emotion-actions">
        <button type="button" class="action-btn" onclick={() => dubbing.clampEmotionSlidersToSumMax()}>
          归一化
        </button>
        <button type="button" class="action-btn secondary" onclick={resetEmotions}>
          重置
        </button>
      </div>
    </div>

    <div class="emo-weight-row">
      <div class="param-label">
        <span>情感混合强度 (emo_alpha)</span>
        <span class="param-value">{dubbing.emoAlpha.toFixed(2)}</span>
      </div>
      <input
        type="range"
        class="emotion-slider"
        min="0"
        max="1"
        step="0.01"
        bind:value={dubbing.emoAlpha}
      />
      <p class="param-hint">控制情感向量与声线的混合比例，建议 ≤0.6 更自然</p>
    </div>
  {/if}

  {#if dubbing.emotionMethod === 'text'}
    <div class="text-input-group">
      <label class="field-label" for="emotion-text-desc">描述你想要的情感语气</label>
      <textarea
        id="emotion-text-desc"
        class="emotion-text-input"
        value={dubbing.emotionText}
        oninput={(e) => (dubbing.emotionText = (e.target as HTMLTextAreaElement).value)}
        placeholder="例: 用温柔关怀的语气"
        rows={4}
      ></textarea>
      <p class="text-mode-hint">
        通过自然语言描述控制情感语气；建议在「参数控制」中将情感强度调至 ≤0.6，听感更自然。
      </p>
    </div>
  {/if}

  {#if dubbing.emotionMethod === 'audio'}
    <div class="audio-input-group">
      <div class="section-header">
        <p class="field-label">情感参考音频</p>
        <span class="field-hint">约 5~30 秒</span>
      </div>

      {#if dubbing.emotionAudioPath}
        <div class="audio-file-card">
          <div class="audio-file-info">
            <Icon name="file-audio" size={20} color="var(--color-primary)" />
            <div class="audio-file-meta">
              <span class="audio-file-name">情感参考音频</span>
              <span class="audio-file-status">已加载</span>
            </div>
          </div>
          <button type="button" class="audio-file-remove" onclick={clearEmotionAudio} title="移除">
            <Icon name="x" size={14} color="var(--color-text-tertiary)" />
          </button>
        </div>
      {:else}
        <button type="button" class="upload-emotion-btn" onclick={handleEmotionAudioUpload}>
          <div class="upload-icon">
            <Icon name="upload" size={18} color="var(--color-primary)" />
          </div>
          <span class="upload-title">上传情感参考音频</span>
          <span class="upload-hint">支持 WAV、MP3 格式</span>
        </button>
      {/if}

      <div class="param-group">
        <div class="param-label">
          <span>情感混合强度 (emo_alpha)</span>
          <span class="param-value">{dubbing.emoAlpha.toFixed(2)}</span>
        </div>
        <input
          type="range"
          class="emotion-slider"
          min="0"
          max="1"
          step="0.01"
          bind:value={dubbing.emoAlpha}
        />
        <p class="param-hint">控制情感参考音频与声线的混合比例</p>
      </div>
    </div>
  {/if}
</div>

<style>
  .emotion-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  .method-selector {
    display: flex;
    gap: 2px;
    background-color: var(--color-bg-base);
    border-radius: var(--border-radius);
    padding: 2px;
  }

  .method-btn {
    flex: 1;
    height: var(--control-height-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing),
      box-shadow var(--transition-duration) var(--transition-timing);
  }

  .method-btn:hover {
    color: var(--color-text-secondary);
  }

  .method-btn.active {
    background-color: var(--color-bg-elevated);
    color: var(--color-text);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .method-btn.active :global(svg) {
    color: var(--color-primary) !important;
  }

  .slider-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .emotion-row {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
    padding: var(--spacing-xs) 0;
  }

  .emotion-icon-label {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    width: 50px;
    flex-shrink: 0;
  }

  .emotion-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .emotion-slider {
    -webkit-appearance: none;
    appearance: none;
    flex: 1;
    height: 4px;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing);
  }

  .emotion-slider.active {
    background: linear-gradient(90deg, var(--color-primary) 0%, var(--color-primary) var(--value, 50%), var(--color-border) var(--value, 50%), var(--color-border) 100%);
  }

  .emotion-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--color-primary);
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: transform 0.2s ease;
  }

  .emotion-slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .emotion-value {
    width: 36px;
    font-size: 11px;
    color: var(--color-text-tertiary);
    text-align: right;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    transition: color var(--transition-duration) var(--transition-timing);
  }

  .emotion-value.active {
    color: var(--color-primary);
    font-weight: 500;
  }

  /* 情感统计区域 */
  .emotion-stats {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    padding: var(--spacing-sm);
    background-color: var(--color-bg-base);
    border-radius: var(--border-radius);
  }

  .emotion-hint {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: 11px;
    color: var(--color-text-disabled);
    margin: 0;
  }

  .emotion-hint.warn {
    color: var(--color-warning);
  }

  .emotion-actions {
    display: flex;
    gap: var(--spacing-xs);
  }

  .action-btn {
    height: var(--control-height-xs);
    padding: 0 var(--spacing-sm);
    font-size: var(--font-size-sm);
    color: var(--color-primary);
    background: transparent;
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition:
      border-color var(--transition-duration) var(--transition-timing),
      background-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing);
  }

  .action-btn:hover {
    border-color: var(--color-primary);
    background-color: var(--color-bg-elevated);
  }

  .action-btn.secondary {
    color: var(--color-text-tertiary);
  }

  .action-btn.secondary:hover {
    border-color: var(--color-text-secondary);
    color: var(--color-text-secondary);
  }

  .emotion-text-input {
    width: 100%;
    padding: var(--spacing-sm);
    background-color: var(--color-bg-base);
    color: var(--color-text);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    font-family: var(--font-family);
    font-size: var(--font-size-sm);
    resize: vertical;
    outline: none;
  }

  .emotion-text-input:focus {
    border-color: var(--color-primary);
  }

  .emotion-text-input::placeholder {
    color: var(--color-text-disabled);
  }

  .field-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .text-mode-hint {
    margin: 0;
    font-size: 11px;
    line-height: 1.4;
    color: var(--color-text-disabled);
  }

  .text-input-group,
  .audio-input-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
  }

  /* 预设区域 */
  .presets-section {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
  }

  .section-label {
    font-size: 11px;
    color: var(--color-text-tertiary);
  }

  .preset-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-xs);
  }

  .preset-chip {
    height: var(--control-height-xs);
    padding: 0 var(--spacing-sm);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: 11px;
    color: var(--color-text-secondary);
    transition:
      border-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing);
  }

  .preset-chip:hover {
    border-color: var(--color-primary);
    color: var(--color-primary);
  }

  /* 情感强度可视化条 */
  .intensity-bar {
    width: 100%;
    height: 4px;
    background-color: var(--color-border);
    border-radius: 2px;
    overflow: hidden;
  }

  .intensity-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
  }

  /* 音频上传 */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .field-hint {
    font-size: 11px;
    color: var(--color-text-disabled);
  }

  .upload-emotion-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-xs);
    height: 80px;
    background: transparent;
    border: 1px dashed var(--color-border);
    border-radius: var(--border-radius);
    cursor: pointer;
    transition:
      border-color var(--transition-duration) var(--transition-timing),
      background-color var(--transition-duration) var(--transition-timing);
  }

  .upload-icon {
    width: var(--control-height-sm);
    height: var(--control-height-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--color-bg-base);
    border-radius: 50%;
  }

  .upload-title {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .upload-hint {
    font-size: 10px;
    color: var(--color-text-disabled);
  }

  .upload-emotion-btn:hover {
    border-color: var(--color-primary);
    background-color: var(--color-bg-base);
  }

  .upload-emotion-btn:hover .upload-title {
    color: var(--color-primary);
  }

  /* 音频文件卡片 */
  .audio-file-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-sm);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
  }

  .audio-file-info {
    display: flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .audio-file-meta {
    display: flex;
    flex-direction: column;
  }

  .audio-file-name {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .audio-file-status {
    font-size: 10px;
    color: var(--color-success);
  }

  .audio-file-remove {
    width: var(--control-height-xs);
    height: var(--control-height-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing);
  }

  .audio-file-remove:hover {
    background-color: var(--color-bg-elevated);
  }

  .audio-file-remove:hover :global(svg) {
    color: var(--color-error) !important;
  }

  .param-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .param-label {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .param-value {
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
  }

  .emo-weight-row {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding-top: var(--spacing-sm);
    border-top: 1px solid var(--color-border-secondary);
  }
</style>
