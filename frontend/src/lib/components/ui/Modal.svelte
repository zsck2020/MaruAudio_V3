<script lang="ts" module>
  export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from '$lib/icons/Icon.svelte';

  interface Props {
    open: boolean;
    title?: string;
    description?: string;
    size?: ModalSize;
    closeOnEscape?: boolean;
    closeOnBackdrop?: boolean;
    showClose?: boolean;
    /** 自定义底部，传入则覆盖默认按钮 */
    footer?: Snippet;
    /** 主体内容 */
    children?: Snippet;
    /** 左上角 icon 名 */
    icon?: string;
    onClose?: () => void;
  }

  let {
    open = $bindable(false),
    title = '',
    description = '',
    size = 'md',
    closeOnEscape = true,
    closeOnBackdrop = true,
    showClose = true,
    footer,
    children,
    icon,
    onClose,
  }: Props = $props();

  function close() {
    open = false;
    onClose?.();
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (!open) return;
    if (closeOnEscape && event.key === 'Escape') {
      event.preventDefault();
      close();
    }
  }

  function handleBackdropClick() {
    if (closeOnBackdrop) close();
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

{#if open}
  <div
    class="modal-backdrop"
    role="presentation"
    onclick={handleBackdropClick}
    onkeydown={(e) => { if (e.key === 'Enter' && closeOnBackdrop) close(); }}
    tabindex="-1"
  >
    <div
      class="modal-card size-{size}"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Dialog'}
      tabindex="-1"
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      {#if title || icon || showClose}
        <header class="modal-header">
          {#if icon}
            <div class="modal-icon">
              <Icon name={icon} size={20} color="var(--color-primary)" />
            </div>
          {/if}
          <div class="modal-titles">
            {#if title}<h2 class="modal-title">{title}</h2>{/if}
            {#if description}<p class="modal-description">{description}</p>{/if}
          </div>
          {#if showClose}
            <button type="button" class="modal-close" onclick={close} aria-label="关闭">
              <Icon name="close" size={14} color="currentColor" />
            </button>
          {/if}
        </header>
      {/if}

      <div class="modal-body">
        {#if children}
          {@render children()}
        {/if}
      </div>

      {#if footer}
        <footer class="modal-footer">{@render footer()}</footer>
      {/if}
    </div>
  </div>
{/if}

<style>
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9000;
    animation: modal-fade-in 0.18s var(--transition-timing);
  }

  .modal-card {
    background-color: var(--color-bg-popover);
    border-radius: var(--border-radius-lg);
    box-shadow: var(--shadow-3);
    display: flex;
    flex-direction: column;
    max-height: 90vh;
    width: 90%;
    animation: modal-pop-in 0.22s var(--transition-timing);
  }

  .size-sm { max-width: 420px; }
  .size-md { max-width: 600px; }
  .size-lg { max-width: 820px; }
  .size-xl { max-width: 1080px; }
  .size-full {
    max-width: calc(100vw - 64px);
    height: calc(100vh - 64px);
    max-height: none;
  }

  .modal-header {
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-md);
    padding: var(--spacing-lg);
    background-color: var(--color-bg-spotlight);
    border-radius: var(--border-radius-lg) var(--border-radius-lg) 0 0;
  }

  .modal-icon {
    width: var(--control-height-sm);
    height: var(--control-height-sm);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: color-mix(in srgb, var(--color-primary) 14%, transparent);
    border-radius: var(--border-radius);
  }

  .modal-titles {
    flex: 1;
    min-width: 0;
  }

  .modal-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text);
  }

  .modal-description {
    margin: 4px 0 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    line-height: 1.5;
  }

  .modal-close {
    flex-shrink: 0;
    width: var(--control-height-xs);
    height: var(--control-height-xs);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    color: var(--color-text-tertiary);
    border: none;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition:
      background-color var(--transition-duration) var(--transition-timing),
      color var(--transition-duration) var(--transition-timing);
  }

  .modal-close:hover {
    background-color: var(--color-bg-glass);
    color: var(--color-text);
  }

  .modal-body {
    padding: var(--spacing-lg);
    overflow-y: auto;
    color: var(--color-text-secondary);
    font-size: var(--font-size);
  }

  .modal-body::after {
    content: '';
    display: block;
    height: 10px;
    flex-shrink: 0;
  }

  .modal-footer {
    padding: var(--spacing-md) var(--spacing-lg);
    display: flex;
    justify-content: flex-end;
    gap: var(--spacing-sm);
    background-color: var(--color-bg-spotlight);
    border-radius: 0 0 var(--border-radius-lg) var(--border-radius-lg);
  }

  @keyframes modal-fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes modal-pop-in {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
</style>
