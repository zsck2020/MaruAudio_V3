<script lang="ts">
  import TextToolbar from '$lib/components/dubbing/TextToolbar.svelte';
  import TextEditor from '$lib/components/dubbing/TextEditor.svelte';
  import LeftBottomBar from '$lib/components/dubbing/LeftBottomBar.svelte';
  import ParamTabs from '$lib/components/dubbing/ParamTabs.svelte';
  import PlayerBar from '$lib/components/dubbing/PlayerBar.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { toast } from '$lib/stores/toast.svelte';
  import * as ttsApi from '$lib/api/tts';

  /** 与 TextEditor 插入逻辑一致的停顿标记 */
  const PAUSE_MARKER = '[#0.5s#]';

  let editorRef: { insertAtCursor: (s: string) => void } | undefined = $state();

  // 页面加载时自动检测引擎可用性
  $effect(() => {
    void dubbing.checkEngineAvailability();
  });

  async function handleGenerate() {
    if (dubbing.wordCount === 0) {
      toast.warning('请输入要配音的文案');
      return;
    }

    if (dubbing.engineMode === 'cloud' && !dubbing.engineAvailable.cloud) {
      toast.warning('请先登录并确保云端余额充足后再生成');
      return;
    }

    // 检查本地引擎可用性
    if (dubbing.engineMode !== 'cloud') {
      const engineKey = dubbing.engineMode as 'lightweight' | 'emotion';
      if (!dubbing.engineAvailable[engineKey]?.available) {
        toast.warning('当前引擎不可用，请检查 TTS 服务是否启动');
        return;
      }
    }

    // 检查参考音频
    if (!dubbing.voiceAudioUrl) {
      toast.warning('请先选择或上传参考音频');
      return;
    }

    // 情感向量归一化
    if (dubbing.showEmotionTab && dubbing.emotionMethod === 'slider') {
      dubbing.clampEmotionSlidersToSumMax();
    }

    // 重置生成状态
    dubbing.generatedAudioPath = null;
    dubbing.isPlaying = false;
    dubbing.isGenerating = true;
    dubbing.progress = 0;
    dubbing.progressMessage = '正在预处理文本…';
    dubbing.generationSegmentTotal = 0;
    dubbing.generationSegmentCurrent = 0;

    try {
      // 构建推理请求
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

      dubbing.progressMessage = '正在生成音频…';
      dubbing.progress = 10;

      const outputPath = await ttsApi.synthesize(req);

      dubbing.progress = 100;
      dubbing.progressMessage = '';
      dubbing.generatedAudioPath = outputPath;
      dubbing.isGenerating = false;
      toast.success('配音生成完成');

    } catch (err) {
      dubbing.isGenerating = false;
      dubbing.progress = 0;
      dubbing.progressMessage = '';
      const msg = err instanceof Error ? err.message : String(err);
      toast.warning(`生成失败: ${msg}`);
    }
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain,.docx';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 文件大小限制：10MB
      const MAX_FILE_SIZE = 10 * 1024 * 1024;
      if (file.size > MAX_FILE_SIZE) {
        toast.warning('文件大小不能超过 10MB');
        return;
      }

      if (file.name.toLowerCase().endsWith('.docx')) {
        toast.info('Word (.docx) 导入开发中，请暂存为 .txt 后导入');
        return;
      }

      try {
        const text = await file.text();

        // 文本长度限制：50000字
        const MAX_TEXT_LENGTH = 50000;
        if (text.length > MAX_TEXT_LENGTH) {
          toast.warning(`文本长度不能超过 ${MAX_TEXT_LENGTH} 字`);
          return;
        }

        dubbing.setText(dubbing.text ? `${dubbing.text}\n${text}` : text);
        toast.success(`已导入 ${file.name}`);
      } catch (error) {
        console.error('文件导入失败:', error);
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
    toast.success('已在句号、问号、感叹号后插入换行（可继续手动调整）');
  }

  function handlePause() {
    editorRef?.insertAtCursor(PAUSE_MARKER);
  }

  function handlePinyin() {
    toast.info('拼音标注：请选中文字后使用（富文本编辑器对接后支持）');
  }

  function handleNumber() {
    toast.info('数字读法规则切换（引擎对接后生效）');
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
    toast.info('字幕生成：将跳转字幕页或弹窗（开发中）');
  }
</script>

<div class="dubbing-page">
  <div class="dubbing-main">
    <div class="left-panel">
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

    <div class="right-panel">
      <ParamTabs />
    </div>
  </div>

  <PlayerBar onRegenerate={handleGenerate} onSubtitle={handleSubtitle} onDownload={handleDownload} />
</div>

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
  }

  .dubbing-main {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
  }

  .left-panel {
    flex: 80;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid var(--color-border-secondary);
    min-width: 0;
  }

  .right-panel {
    flex: 20;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 320px;
  }

  /* 响应式设计 - 平板和移动端 */
  @media (max-width: 1024px) {
    .dubbing-main {
      flex-direction: column;
    }

    .left-panel {
      flex: 1;
      border-right: none;
      border-bottom: 1px solid var(--color-border-secondary);
      min-height: 300px;
    }

    .right-panel {
      flex: 0 0 auto;
      min-width: 100%;
      max-height: 50vh;
      overflow-y: auto;
    }
  }

  @media (max-width: 768px) {
    .left-panel {
      min-height: 200px;
    }

    .right-panel {
      max-height: 60vh;
    }
  }
</style>
