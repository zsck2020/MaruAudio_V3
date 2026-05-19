<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';
  import { toast } from '$lib/stores/toast.svelte';

  interface Props {
    onUpload: (file: File, url: string) => void;
  }

  let { onUpload }: Props = $props();

  let isDragging = $state(false);

  function handleUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.wav,.mp3,.flac';
    input.onchange = () => {
      const file = input.files?.[0];
      if (file) {
        loadFile(file);
      }
    };
    input.click();
  }

  function loadFile(file: File) {
    // 文件大小限制：50MB
    const MAX_FILE_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.warning('音频文件大小不能超过 50MB');
      return;
    }

    try {
      const url = URL.createObjectURL(file);
      onUpload(file, url);
      toast.info('提示：为获得最佳效果，建议使用剪映等专业工具分离出纯净人声后再上传');
    } catch (error) {
      console.error('音频文件加载失败:', error);
      toast.warning(`加载失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
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
        loadFile(file);
      } else {
        toast.warning('请上传音频文件（.wav, .mp3, .flac）');
      }
    }
  }

  function handleRecord() {
    toast.info('录音功能将在后续版本开放');
  }
</script>

<div class="uploader-container">
  <!-- 拖放上传区域 -->
  <button type="button" class="drop-area"
    class:dragging={isDragging}
    ondragenter={handleDragEnter}
    ondragleave={handleDragLeave}
    ondragover={handleDragOver}
    ondrop={handleDrop}
    onclick={handleUpload}
    aria-label="上传参考音频"
  >
    <div class="drop-icon">
      <Icon name="upload" size={40} color={isDragging ? 'var(--color-primary)' : 'var(--color-text-tertiary)'} />
    </div>
    <div class="drop-text">点击上传或拖拽文件到此处</div>
    <div class="drop-hint">WAV / MP3 / FLAC · 建议 3-15 秒</div>
  </button>

  <!-- 或 -->
  <div class="or-divider"><span>或</span></div>

  <!-- 录制按钮 -->
  <button type="button" class="record-btn" onclick={handleRecord} title="录音功能将在后续版本开放">
    <Icon name="microphone" size={16} color="var(--color-text-disabled)" />
    <span>录制样音</span>
    <span class="coming-soon-tag">待开放</span>
  </button>
</div>

<style>
  .uploader-container {
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
    color: inherit;
    font: inherit;
    text-align: center;
    cursor: pointer;
    transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  }

  .drop-area:hover,
  .drop-area.dragging {
    background: rgba(59, 130, 246, 0.08);
    border-color: var(--color-primary);
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }

  .drop-area:focus-visible,
  .record-btn:focus-visible {
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-primary) 65%, transparent);
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

  .record-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-sm);
    height: var(--control-height-sm);
    padding: 0 var(--spacing-md);
    background: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    transition: background-color var(--transition-duration) var(--transition-timing), color var(--transition-duration) var(--transition-timing), border-color var(--transition-duration) var(--transition-timing);
  }

  .record-btn:hover {
    border-color: var(--color-border);
    color: var(--color-text-tertiary);
  }

  .coming-soon-tag {
    font-size: 10px;
    padding: 1px 5px;
    border-radius: var(--border-radius-sm);
    background-color: color-mix(in srgb, var(--color-warning) 18%, transparent);
    color: var(--color-warning);
  }
</style>
