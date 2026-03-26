<script lang="ts">
  import { dubbing } from '$lib/stores/dubbing.svelte';

  let textareaEl: HTMLTextAreaElement | undefined = $state();

  // 使用 $derived 从全局状态派生本地值
  let text = $derived(dubbing.text);

  function handleInput(e: Event) {
    const target = e.target as HTMLTextAreaElement;
    dubbing.setText(target.value);
  }

  /** 在光标处插入文本（供父组件调用 bind:this） */
  export function insertAtCursor(insert: string) {
    const el = textareaEl;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const value = dubbing.text;
    const newValue = value.slice(0, start) + insert + value.slice(end);
    dubbing.setText(newValue);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
    });
  }
</script>

<div class="editor-wrapper">
  <textarea
    bind:this={textareaEl}
    class="text-editor"
    value={text}
    oninput={handleInput}
    placeholder="在此输入或粘贴要配音的文案..."
    spellcheck="false"
  ></textarea>
</div>

<style>
  .editor-wrapper {
    flex: 1;
    display: flex;
    min-height: 0;
    border: 1px solid var(--color-border-secondary);
    border-top: none;
    border-radius: 0;
    overflow: hidden;
    background-color: var(--color-bg-base);
  }

  .text-editor {
    flex: 1;
    width: 100%;
    min-height: 0;
    padding: var(--spacing-lg);
    background-color: var(--color-bg-base);
    color: var(--color-text);
    border: none;
    border-radius: inherit;
    font-family: var(--font-family);
    font-size: var(--font-size);
    line-height: var(--line-height);
    resize: none;
    outline: none;
    -webkit-font-smoothing: antialiased;
  }

  .text-editor::placeholder {
    color: var(--color-text-disabled);
  }
</style>
