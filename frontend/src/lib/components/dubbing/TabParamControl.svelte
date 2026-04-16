<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';

  let isLightweight = $derived(dubbing.engineMode === 'lightweight');
  let isEmotion = $derived(dubbing.engineMode === 'emotion');
  let isCloud = $derived(dubbing.engineMode === 'cloud');

  let samplingHint = $derived(
    isLightweight
      ? 'IndexTTS 1.5 默认：温度 1.0、Top-P 0.8、Top-K 30'
      : 'IndexTTS 2.0 默认：温度 0.8、Top-P 0.8、Top-K 30'
  );

  // 快捷预设
  const presets = [
    { name: '标准', temp: 1.0, topP: 0.8, topK: 30 },
    { name: '稳定', temp: 0.6, topP: 0.5, topK: 20 },
    { name: '创意', temp: 1.2, topP: 0.95, topK: 50 },
  ];

  function applyPreset(temp: number, tp: number, tk: number) {
    dubbing.temperature = temp;
    dubbing.topP = tp;
    dubbing.topK = tk;
  }

  function resetToDefault() {
    if (isLightweight) {
      dubbing.temperature = 1.0;
      dubbing.topP = 0.8;
      dubbing.topK = 30;
      dubbing.intervalSilence = 200;
      dubbing.maxTextTokens = 120;
    } else {
      dubbing.temperature = 0.8;
      dubbing.topP = 0.8;
      dubbing.topK = 30;
      dubbing.intervalSilence = 200;
      dubbing.maxTextTokens = 120;
      dubbing.emoAlpha = 0.6;
    }
  }
</script>

<div class="param-panel">
  <div class="param-section-title">
    <Icon name="clock" size={12} color="var(--color-text-tertiary)" />
    <span>分段与静音</span>
  </div>

  <div class="param-group">
    <div class="param-label">
      <span>段间静音</span>
      <span class="param-value">{dubbing.intervalSilence}ms</span>
    </div>
    <input
      type="range"
      class="param-slider"
      min="0"
      max="1000"
      step="50"
      bind:value={dubbing.intervalSilence}
    />
    <div class="param-hint">与引擎 interval_silence 一致；分段之间插入静音时长</div>
  </div>

  <div class="param-group">
    <div class="param-label">
      <span>单段最大 Token</span>
      <span class="param-value">{dubbing.maxTextTokens}</span>
    </div>
    <input
      type="range"
      class="param-slider"
      min="50"
      max="200"
      step="1"
      bind:value={dubbing.maxTextTokens}
    />
    <div class="param-hint">对应 max_text_tokens；建议 100~120，上限 200</div>
  </div>

  {#if dubbing.supportsBatchGeneration && dubbing.generationMode === 'batch'}
    <div class="param-group">
      <div class="param-label">
        <span>分桶容量</span>
        <span class="param-value">{dubbing.bucketMaxSize}</span>
      </div>
      <input
        type="range"
        class="param-slider"
        min="1"
        max="16"
        step="1"
        bind:value={dubbing.bucketMaxSize}
      />
      <div class="param-hint">infer_fast 分桶批处理，相近长度分句同批推理，建议 2~8</div>
    </div>
  {/if}

  <div class="param-divider" role="separator"></div>

  <!-- 采样参数 -->
  <div class="param-section-header">
    <div class="param-section-title">
      <Icon name="sliders" size={12} color="var(--color-text-tertiary)" />
      <span>GPT 采样参数</span>
    </div>
    <button type="button" class="reset-btn" onclick={resetToDefault} title="恢复默认">
      <Icon name="refresh-cw" size={10} color="var(--color-text-tertiary)" />
    </button>
  </div>

  <div class="presets-row">
    {#each presets as preset}
      <button
        type="button"
        class="preset-chip"
        onclick={() => applyPreset(preset.temp, preset.topP, preset.topK)}
      >
        {preset.name}
      </button>
    {/each}
  </div>

  <p class="param-hint section-hint">{samplingHint}</p>

  <div class="param-group">
    <div class="param-label">
      <span>温度</span>
      <span class="param-value">{dubbing.temperature.toFixed(1)}</span>
    </div>
    <input
      type="range"
      class="param-slider"
      min="0.1"
      max="1.5"
      step="0.1"
      bind:value={dubbing.temperature}
    />
  </div>

  <div class="param-group">
    <div class="param-label">
      <span>Top-P</span>
      <span class="param-value">{dubbing.topP.toFixed(2)}</span>
    </div>
    <input
      type="range"
      class="param-slider"
      min="0.1"
      max="1.0"
      step="0.01"
      bind:value={dubbing.topP}
    />
  </div>

  <div class="param-group">
    <div class="param-label">
      <span>Top-K</span>
      <span class="param-value">{dubbing.topK}</span>
    </div>
    <input
      type="range"
      class="param-slider"
      min="1"
      max="100"
      step="1"
      bind:value={dubbing.topK}
    />
  </div>

  {#if !isLightweight}
    <div class="param-divider" role="separator"></div>
    <div class="param-section-title">IndexTTS 2.0 · 情感混合</div>

    <div class="param-group">
      <div class="param-label">
        <span>情感强度 (emo_alpha)</span>
        <span class="param-value">{dubbing.emoAlpha.toFixed(2)}</span>
      </div>
      <input
        type="range"
        class="param-slider"
        min="0"
        max="1"
        step="0.01"
        bind:value={dubbing.emoAlpha}
      />
      <div class="param-hint">控制情感向量 / 情感参考与声线的混合比例；文本情感 (Qwen) 建议 ≤0.6 更自然</div>
    </div>
  {/if}
</div>

<style>
  .param-panel {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-md);
    padding: var(--spacing-md);
  }

  .param-section-title {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    font-weight: 500;
  }

  .param-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing);
  }

  .reset-btn:hover {
    background-color: var(--color-bg-spotlight);
  }

  /* 快捷预设 */
  .presets-row {
    display: flex;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
  }

  .preset-chip {
    height: 24px;
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

  .section-hint {
    margin: -4px 0 0;
    line-height: 1.4;
  }

  .param-divider {
    height: 1px;
    background-color: var(--color-border-secondary);
    margin: var(--spacing-xs) 0;
  }

  .param-group {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .param-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .param-value {
    color: var(--color-text-tertiary);
    font-variant-numeric: tabular-nums;
    min-width: 48px;
    text-align: right;
  }

  .param-hint {
    font-size: 11px;
    color: var(--color-text-disabled);
  }

  .param-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 4px;
    background: var(--color-border);
    border-radius: 2px;
    outline: none;
    cursor: pointer;
  }

  .param-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--color-bg-elevated);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
    cursor: pointer;
  }
</style>
