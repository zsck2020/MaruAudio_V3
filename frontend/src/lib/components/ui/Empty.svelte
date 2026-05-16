<script lang="ts" module>
  export type EmptySize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from '$lib/icons/Icon.svelte';

  interface Props {
    description?: string;
    icon?: string;
    size?: EmptySize;
    showIcon?: boolean;
    children?: Snippet;
  }

  let {
    description = '暂无数据',
    icon = 'ant-design:inbox-outlined',
    size = 'md',
    showIcon = true,
    children,
  }: Props = $props();

  const iconSizeMap: Record<EmptySize, number> = { sm: 28, md: 48, lg: 72 };
  let iconSize = $derived(iconSizeMap[size]);
</script>

<div class="ui-empty size-{size}">
  {#if showIcon}
    <div class="empty-illustration" aria-hidden="true">
      <Icon name={icon} size={iconSize} color="var(--color-text-quaternary)" />
    </div>
  {/if}
  {#if description}
    <p class="empty-desc">{description}</p>
  {/if}
  {#if children}
    <div class="empty-extra">{@render children()}</div>
  {/if}
</div>

<style>
  .ui-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-md);
    color: var(--color-text-tertiary);
    text-align: center;
    user-select: none;
  }

  .ui-empty.size-sm { padding: var(--spacing-md); gap: var(--spacing-xs); }
  .ui-empty.size-md { padding: var(--spacing-xl); gap: var(--spacing-md); }
  .ui-empty.size-lg { padding: var(--spacing-xxl); gap: var(--spacing-lg); }

  .empty-illustration {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.85;
  }

  .empty-desc {
    margin: 0;
    font-size: var(--font-size-sm);
    color: var(--color-text-tertiary);
    line-height: var(--line-height);
  }

  .ui-empty.size-lg .empty-desc { font-size: var(--font-size); }

  .empty-extra {
    margin-top: var(--spacing-xs);
  }
</style>
