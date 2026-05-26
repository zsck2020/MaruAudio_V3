<script lang="ts">
  import TextToolbar from '$lib/components/dubbing/TextToolbar.svelte';
  import TextEditor from '$lib/components/dubbing/TextEditor.svelte';
  import LeftBottomBar from '$lib/components/dubbing/LeftBottomBar.svelte';
  import ReferenceAudioPanel from '$lib/components/dubbing/ReferenceAudioPanel.svelte';
  import TabParamControl from '$lib/components/dubbing/TabParamControl.svelte';
  import TabEmotionControl from '$lib/components/dubbing/TabEmotionControl.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Icon from '$lib/icons/Icon.svelte';
  import PlayerBar from '$lib/components/dubbing/PlayerBar.svelte';
  import { goto } from '$app/navigation';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import * as ttsApi from '$lib/api/tts';

  const PAUSE_MARKER = '…';

  let editorRef: { insertAtCursor: (s: string) => void; getSelectedText: () => string; replaceSelection: (s: string) => void } | undefined = $state();
  let showParamModal = $state(false);
  let showEmotionModal = $state(false);
  let showPinyinPicker = $state(false);
  let pinyinOptions = $state<{ char: string; readings: string[]; selected: string }[]>([]);

  $effect(() => {
    void dubbing.checkEngineAvailability();
  });

  async function handleGenerate() {
    if (dubbing.wordCount === 0) {
      toast.warning('请输入要配音的文案');
      return;
    }

    if (!dubbing.engineAvailable[dubbing.engineMode]?.available) {
      if (dubbing.engineMode === 'cloud') {
        toast.warning('请先登录并确保云端余额充足后再生成');
      } else {
        toast.warning('当前引擎不可用，请检查 TTS 服务是否启动');
      }
      return;
    }

    if (!dubbing.voiceAudioUrl) {
      toast.warning('请先选择或上传参考音频');
      return;
    }

    if (dubbing.showEmotionTab && dubbing.emotionMethod === 'slider') {
      dubbing.clampEmotionSlidersToSumMax();
    }

    dubbing.generatedAudioPath = null;
    dubbing.isPlaying = false;
    dubbing.isGenerating = true;
    dubbing.progress = 0;
    dubbing.progressMessage = '正在预处理文本…';
    dubbing.generationSegmentTotal = 0;
    dubbing.generationSegmentCurrent = 0;

    try {
      const req: ttsApi.SynthesizeRequest = {
        engine: dubbing.engineMode,
        text: dubbing.text,
        speaker_audio_path: dubbing.voiceAudioUrl!,
        inference_mode: dubbing.generationMode === 'batch' ? 'batch' : 'normal',
        interval_silence: dubbing.intervalSilence,
        max_text_tokens_per_segment: dubbing.maxTextTokens,
        bucket_max_size: dubbing.bucketMaxSize,
        emotion_method: dubbing.emotionMethod,
        emotion_vector: dubbing.emotionMethod === 'slider'
          ? [dubbing.emotionSliders.happy, dubbing.emotionSliders.angry, dubbing.emotionSliders.sad,
             dubbing.emotionSliders.afraid, dubbing.emotionSliders.disgusted, dubbing.emotionSliders.melancholic,
             dubbing.emotionSliders.surprised, dubbing.emotionSliders.calm]
          : undefined,
        emotion_text: dubbing.emotionMethod === 'text' ? dubbing.emotionText || undefined : undefined,
        emotion_audio_path: dubbing.emotionMethod === 'audio' ? dubbing.emotionAudioPath || undefined : undefined,
        emo_alpha: dubbing.emoAlpha,
        temperature: dubbing.temperature,
        top_p: dubbing.topP,
        top_k: dubbing.topK,
        num_beams: 3,
        repetition_penalty: 10.0,
        max_mel_tokens: 600,
      };

      const { promise, cancel } = ttsApi.synthesizeStream(req, {
        onProgress: (evt) => {
          dubbing.progress = evt.progress;
          dubbing.progressMessage = evt.message;
          dubbing.generationSegmentCurrent = evt.segmentCurrent;
          dubbing.generationSegmentTotal = evt.segmentTotal;
        },
        onComplete: (evt) => {
          dubbing.progress = 100;
          dubbing.progressMessage = '';
          dubbing.generatedAudioPath = evt.outputPath;
        },
        onError: (evt) => {
          dubbing.isGenerating = false;
          dubbing.progress = 0;
          dubbing.progressMessage = '';
          toast.warning(`生成失败: ${evt.message}`);
        },
      });

      dubbing.currentStreamCancel = cancel;
      const outputPath = await promise;

      dubbing.isGenerating = false;
      dubbing.currentStreamCancel = null;
      if (!dubbing.generatedAudioPath) {
        dubbing.generatedAudioPath = outputPath;
      }
      toast.success('配音生成完成');

    } catch (err) {
      dubbing.isGenerating = false;
      dubbing.currentStreamCancel = null;
      dubbing.progress = 0;
      dubbing.progressMessage = '';
      const msg = err instanceof Error ? err.message : String(err);
      if (msg !== '推理已取消') {
        toast.warning(`生成失败: ${msg}`);
      }
    }
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.warning('文件大小不能超过 10MB');
        return;
      }
      try {
        const text = await file.text();
        const MAX_TEXT_LENGTH = 50000;
        if (text.length > MAX_TEXT_LENGTH) {
          toast.warning(`文本长度不能超过 ${MAX_TEXT_LENGTH} 字`);
          return;
        }
        dubbing.setText(dubbing.text ? `${dubbing.text}\n${text}` : text);
        toast.success(`已导入 ${file.name}`);
      } catch (error) {
        toast.warning(`读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    };
    input.click();
  }

  function handleSegment() {
    const t = dubbing.text;
    if (!t.trim()) {
      toast.warning('请先输入要分段的文案');
      return;
    }
    const next = t.replace(/([。！？!?])/g, '$1\n').replace(/\n{3,}/g, '\n\n');
    dubbing.setText(next);
    toast.success('已按句号、问号、感叹号自动分段');
  }

  function handlePause() {
    editorRef?.insertAtCursor(PAUSE_MARKER);
  }

  async function handlePinyin() {
    const selected = editorRef?.getSelectedText() ?? '';
    if (!selected.trim()) {
      toast.info('请先选中要标注拼音的汉字');
      return;
    }

    const chineseChars = selected.match(/[\u4e00-\u9fff]/g);
    if (!chineseChars || chineseChars.length === 0) {
      toast.warning('选中文本中没有汉字');
      return;
    }

    try {
      const { pinyin, polyphonic } = await import('pinyin-pro');
      const contextPinyin = pinyin(selected, { toneType: 'num', type: 'array' }) as string[];
      const allReadings = polyphonic(selected, { toneType: 'num', type: 'array' }) as string[][];

      const hasPolyphonic = allReadings.some(r => r.length > 1);
      if (!hasPolyphonic) {
        const result = contextPinyin.join(' ');
        editorRef?.replaceSelection(result);
        toast.success(`已将「${selected}」转为拼音：${result}`);
        return;
      }

      pinyinOptions = [];
      for (let i = 0; i < selected.length; i++) {
        const ch = selected[i];
        if (/[\u4e00-\u9fff]/.test(ch)) {
          const idx = pinyinOptions.length;
          const readings = allReadings[idx] ?? [contextPinyin[idx]];
          const defaultReading = contextPinyin[idx] ?? readings[0];
          pinyinOptions.push({ char: ch, readings, selected: defaultReading });
        }
      }
      showPinyinPicker = true;
    } catch {
      toast.warning('拼音转换失败');
    }
  }

  function confirmPinyin() {
    const result = pinyinOptions.map(o => o.selected).join(' ');
    editorRef?.replaceSelection(result);
    toast.success(`拼音已确认：${result}`);
    showPinyinPicker = false;
    pinyinOptions = [];
  }

  function handleNumber() {
    toast.info('引擎自动将数字转为中文读法，无需手动处理');
  }

  async function handleDownload() {
    if (!dubbing.generatedAudioPath) {
      toast.info('暂无已生成音频可下载');
      return;
    }
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { readFile, writeFile } = await import('@tauri-apps/plugin-fs');
      const path = dubbing.generatedAudioPath;
      const fileName = path.split(/[/\\]/).pop() || 'audio.wav';
      const savePath = await save({
        defaultPath: fileName,
        filters: [{ name: 'WAV 音频', extensions: ['wav'] }],
      });
      if (savePath) {
        const data = await readFile(path);
        await writeFile(savePath, data);
        toast.success('音频已保存');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.warning(`保存失败: ${msg}`);
    }
  }

  function handleSubtitle() {
    goto('/copywriting');
  }
</script>

<div class="dubbing-page">
  <div class="dubbing-main">
    <!-- 左侧：文本编辑区（卡片） -->
    <div class="editor-card">
      <TextToolbar
        onSegment={handleSegment}
        onPause={handlePause}
        onPinyin={handlePinyin}
        onNumber={handleNumber}
      />
      <TextEditor bind:this={editorRef} />
      <LeftBottomBar
        onGenerate={handleGenerate}
        onImport={handleImport}
      />
    </div>

    <!-- 右侧：控制面板区 -->
    <div class="control-column">
      <!-- 操作按钮组 -->
      <div class="action-buttons">
        <button
          type="button"
          class="action-card-btn"
          onclick={() => showParamModal = true}
        >
          <Icon name="sliders" size={16} color="var(--color-primary)" />
          <div class="action-card-info">
            <span class="action-card-title">参数设置</span>
            <span class="action-card-sub">温度 {dubbing.temperature.toFixed(1)} · Top-P {dubbing.topP.toFixed(1)} · 静音 {dubbing.intervalSilence}ms</span>
          </div>
          <Icon name="ant-design:right-outlined" size={12} color="var(--color-text-tertiary)" />
        </button>

        {#if dubbing.showEmotionTab}
          <button
            type="button"
            class="action-card-btn"
            onclick={() => showEmotionModal = true}
          >
            <Icon name="heart" size={16} color="var(--color-accent)" />
            <div class="action-card-info">
              <span class="action-card-title">情感控制</span>
              <span class="action-card-sub">
                {dubbing.emotionMethod === 'slider' ? '向量模式' : dubbing.emotionMethod === 'text' ? '文本模式' : '音频模式'}
                · 强度 {dubbing.emoAlpha.toFixed(1)}
              </span>
            </div>
            <Icon name="ant-design:right-outlined" size={12} color="var(--color-text-tertiary)" />
          </button>
        {/if}
      </div>

      <!-- 参考音频卡片 -->
      <div class="control-card voice-card">
        <ReferenceAudioPanel />
      </div>
    </div>
  </div>

  <!-- 底部播放器 -->
  <div class="player-card-wrap">
    <PlayerBar onRegenerate={handleGenerate} onSubtitle={handleSubtitle} onDownload={handleDownload} />
  </div>
</div>

<!-- 拼音选择弹窗 -->
<Modal bind:open={showPinyinPicker} title="拼音标注 · 多音字选择" size="sm">
  <div class="pinyin-picker">
    {#each pinyinOptions as opt, i (i)}
      <div class="py-char-group">
        <span class="py-char">{opt.char}</span>
        <div class="py-readings">
          {#each opt.readings as r (r)}
            <button type="button" class="py-reading" class:active={opt.selected === r} onclick={() => { pinyinOptions[i].selected = r; pinyinOptions = pinyinOptions; }}>
              {r}
            </button>
          {/each}
        </div>
      </div>
    {/each}
    <div class="py-preview">{pinyinOptions.map(o => o.selected).join(' ')}</div>
  </div>
  {#snippet footer()}
    <Button variant="default" onclick={() => showPinyinPicker = false}>取消</Button>
    <Button variant="primary" onclick={confirmPinyin}>确认</Button>
  {/snippet}
</Modal>

<!-- 参数设置弹窗 -->
<Modal bind:open={showParamModal} title="参数设置" size="md" icon="sliders">
  <TabParamControl />
</Modal>

<!-- 情感控制弹窗 -->
<Modal bind:open={showEmotionModal} title="情感控制" size="md" icon="heart">
  <TabEmotionControl />
</Modal>

<style>
  :global(.content:has(.dubbing-page)) {
    overflow: hidden !important;
  }

  .dubbing-page {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: clamp(8px, 1.2vw, 15px);
    gap: var(--spacing-sm);
  }

  .dubbing-main {
    flex: 1;
    display: flex;
    gap: var(--spacing-sm);
    min-height: 0;
    overflow: hidden;
  }

  .editor-card {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
    background-color: var(--color-bg-elevated);
    border-radius: var(--border-radius);
  }

  /* 右侧控制面板 */
  .control-column {
    width: clamp(220px, 24vw, 300px);
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-sm);
    overflow: hidden;
  }

  .control-card {
    background-color: var(--color-bg-elevated);
    overflow: hidden;
    flex-shrink: 0;
    border-radius: var(--border-radius);
  }

  .voice-card {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* 操作按钮组 */
  .action-buttons {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-xs);
    flex-shrink: 0;
  }

  .action-card-btn {
    display: flex;
    align-items: center;
    gap: var(--spacing-md);
    width: 100%;
    padding: var(--spacing-md);
    background-color: var(--color-bg-elevated);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition:
      background-color var(--motion-duration-mid) var(--motion-ease-base),
      transform var(--motion-duration-fast) var(--motion-ease-base);
    text-align: left;
  }

  .action-card-btn:hover {
    background-color: var(--color-bg-spotlight);
  }

  .action-card-btn:active {
    transform: scale(0.98);
  }

  .action-card-btn:focus-visible {
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }

  .action-card-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .action-card-title {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
  }

  .action-card-sub {
    font-size: 11px;
    color: var(--color-text-tertiary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* 底部播放器 */
  .player-card-wrap {
    flex-shrink: 0;
    background-color: var(--color-bg-elevated);
    border-radius: var(--border-radius);
  }

  /* 拼音选择器 */
  .pinyin-picker {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-lg);
    padding: var(--spacing-md) 0;
    justify-content: center;
  }

  .py-char-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-sm);
    min-width: 72px;
    padding: var(--spacing-md);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-lg);
  }

  .py-char {
    font-size: 32px;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
  }

  .py-readings {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
  }

  .py-reading {
    height: 30px;
    min-width: 56px;
    padding: 0 var(--spacing-md);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    background: transparent;
    color: var(--color-text-secondary);
    font-size: var(--font-size);
    font-family: ui-monospace, Menlo, Consolas, monospace;
    cursor: pointer;
    transition: border-color var(--motion-duration-mid) var(--motion-ease-base), background var(--motion-duration-mid) var(--motion-ease-base), color var(--motion-duration-mid) var(--motion-ease-base), transform 0.1s;
  }

  .py-reading:hover { border-color: var(--color-primary); color: var(--color-primary); transform: scale(1.04); }
  .py-reading.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; box-shadow: 0 2px 8px color-mix(in srgb, var(--color-primary) 35%, transparent); }

  .py-preview {
    width: 100%;
    text-align: center;
    padding: var(--spacing-sm) var(--spacing-md);
    background: var(--color-bg-base);
    border-radius: var(--border-radius);
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: var(--font-size-lg);
    color: var(--color-primary);
    letter-spacing: 2px;
    margin-top: var(--spacing-sm);
  }

  /* 响应式 */
  @media (max-width: 1024px) {
    .dubbing-main {
      flex-direction: column;
    }

    .editor-card {
      flex: 1;
      min-height: 250px;
    }

    .control-column {
      width: 100%;
      flex-direction: row;
      flex-wrap: wrap;
    }

    .control-card {
      flex: 1;
      min-width: 200px;
    }

    .voice-card {
      flex: 2;
    }

    .action-buttons {
      flex-direction: row;
      width: 100%;
    }

    .action-card-btn {
      flex: 1;
    }
  }
</style>
