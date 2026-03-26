<script lang="ts">
  import TextToolbar from '$lib/components/dubbing/TextToolbar.svelte';
  import TextEditor from '$lib/components/dubbing/TextEditor.svelte';
  import LeftBottomBar from '$lib/components/dubbing/LeftBottomBar.svelte';
  import ParamTabs from '$lib/components/dubbing/ParamTabs.svelte';
  import PlayerBar from '$lib/components/dubbing/PlayerBar.svelte';
  import { dubbing } from '$lib/stores/dubbing.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  /** 与 TextEditor 插入逻辑一致的停顿标记 */
  const PAUSE_MARKER = '[#0.5s#]';

  let editorRef: { insertAtCursor: (s: string) => void } | undefined = $state();

  function handleGenerate() {
    if (dubbing.wordCount === 0) {
      toast.warning('请输入要配音的文案');
      return;
    }

    if (dubbing.engineMode === 'cloud' && !dubbing.engineAvailable.cloud) {
      toast.warning('请先登录并确保云端余额充足后再生成');
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
    dubbing.generationSegmentTotal = 5;
    dubbing.generationSegmentCurrent = 0;

    let step = 0;
    const steps = [
      { msg: '正在预处理文本…', seg: 0 },
      { msg: '正在生成音频…', seg: 2 },
      { msg: '正在生成音频…', seg: 4 },
      { msg: '正在合并音频…', seg: 5 },
    ];
    const timer = setInterval(() => {
      step++;
      if (step <= steps.length) {
        const cur = steps[step - 1];
        dubbing.progress = Math.round((step / (steps.length + 1)) * 100);
        dubbing.progressMessage = cur.msg;
        dubbing.generationSegmentCurrent = cur.seg;
      } else {
        clearInterval(timer);
        dubbing.isGenerating = false;
        dubbing.progress = 100;
        dubbing.progressMessage = '';
        dubbing.generationSegmentCurrent = 0;
        dubbing.generationSegmentTotal = 0;
        toast.success('配音生成完成（演示进度，尚未写入真实音频文件）');
      }
    }, 700);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,text/plain,.docx';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.name.toLowerCase().endsWith('.docx')) {
        toast.info('Word (.docx) 导入开发中，请暂存为 .txt 后导入');
        return;
      }
      try {
        const text = await file.text();
        dubbing.setText(dubbing.text ? `${dubbing.text}\n${text}` : text);
        toast.success(`已导入 ${file.name}`);
      } catch {
        toast.warning('读取文件失败');
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

  function handleDownload() {
    if (!dubbing.generatedAudioPath) {
      toast.info('暂无已生成音频可下载');
      return;
    }
    toast.info('下载到本地（对接 Tauri 保存对话框后生效）');
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
</style>
