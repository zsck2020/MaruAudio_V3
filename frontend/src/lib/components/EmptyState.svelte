<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';

  let {
    icon = 'document',
    title = '',
    hint = '功能开发中，敬请期待',
  }: {
    icon?: string;
    title?: string;
    hint?: string;
  } = $props();
</script>

<div class="empty-state">
  <Icon name={icon} size={48} color="var(--color-text-quaternary)" />
  {#if title}
    <p class="empty-state-title">{title}</p>
  {/if}
  <p class="empty-state-hint">{hint}</p>
</div>

<style>
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    opacity: 0.6;
  }

  .empty-state-title {
    font-size: var(--font-size-lg, 16px);
    font-weight: 500;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .empty-state-hint {
    font-size: var(--font-size-sm, 12px);
    color: var(--color-text-tertiary);
    margin: 0;
  }
</style>
