<script lang="ts">
  import { toast } from '$lib/stores/toast.svelte';
  import Icon from '$lib/icons/Icon.svelte';

  const TYPE_ICONS: Record<string, string> = {
    success: 'ant-design:check-circle-outlined',
    error: 'ant-design:close-circle-outlined',
    warning: 'ant-design:exclamation-circle-outlined',
    info: 'ant-design:info-circle-outlined',
  };

  const TYPE_COLORS: Record<string, string> = {
    success: 'var(--color-success)',
    error: 'var(--color-error)',
    warning: 'var(--color-warning)',
    info: 'var(--color-primary)',
  };
</script>

{#if toast.items.length > 0}
  <div class="toast-container">
    {#each toast.items as item (item.id)}
      <div class="toast-item" role="alert">
        <Icon name={TYPE_ICONS[item.type]} size={16} color={TYPE_COLORS[item.type]} />
        <span class="toast-message">{item.message}</span>
        <button class="toast-close" onclick={() => toast.remove(item.id)} aria-label="关闭">
          <Icon name="close" size={12} color="var(--color-text-tertiary)" />
        </button>
      </div>
    {/each}
  </div>
{/if}

<style>
  .toast-container {
    position: fixed;
    top: 64px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
  }

  .toast-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background-color: var(--color-bg-elevated);
    border-radius: var(--border-radius);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.06);
    pointer-events: auto;
    animation: toast-in 0.3s var(--transition-timing);
    min-width: 200px;
    max-width: 400px;
  }

  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(-12px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .toast-message {
    flex: 1;
    font-size: var(--font-size);
    color: var(--color-text);
    line-height: 1.4;
  }

  .toast-close {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing);
  }

  .toast-close:hover {
    background-color: var(--color-bg-spotlight);
  }
</style>
