<script lang="ts" module>
  export type TagColor = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'accent';
  export type TagSize = 'sm' | 'md';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from '$lib/icons/Icon.svelte';

  interface Props {
    color?: TagColor;
    size?: TagSize;
    bordered?: boolean;
    closable?: boolean;
    icon?: string;
    children?: Snippet;
    text?: string;
    onclose?: () => void;
    onclick?: (event: MouseEvent) => void;
  }

  let {
    color = 'default',
    size = 'md',
    bordered = true,
    closable = false,
    icon,
    children,
    text,
    onclose,
    onclick,
  }: Props = $props();

  let isInteractive = $derived(!!onclick);
</script>

<svelte:element
  this={isInteractive ? 'button' : 'span'}
  class="ui-tag color-{color} size-{size}"
  class:bordered
  class:interactive={isInteractive}
  role={isInteractive ? 'button' : undefined}
  type={isInteractive ? 'button' : undefined}
  onclick={isInteractive ? onclick : undefined}
>
  {#if icon}
    <Icon name={icon} size={size === 'sm' ? 10 : 12} color="currentColor" />
  {/if}
  <span class="tag-text">{#if children}{@render children()}{:else}{text ?? ''}{/if}</span>
  {#if closable}
    <button
      type="button"
      class="close-btn"
      aria-label="移除标签"
      onclick={(e) => { e.stopPropagation(); onclose?.(); }}
    >
      <Icon name="close" size={size === 'sm' ? 8 : 10} color="currentColor" />
    </button>
  {/if}
</svelte:element>

<style>
  .ui-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    border-radius: var(--border-radius-sm);
    font-family: inherit;
    line-height: 1;
    background: transparent;
    border: 1px solid transparent;
    cursor: default;
    transition:
      background-color var(--motion-duration-fast) var(--motion-ease-base),
      color var(--motion-duration-fast) var(--motion-ease-base);
  }

  .ui-tag.size-sm { padding: 1px 6px; font-size: var(--font-size-xs); height: 18px; }
  .ui-tag.size-md { padding: 2px 8px; font-size: var(--font-size-sm); height: 22px; }

  .ui-tag.interactive {
    cursor: pointer;
  }
  .ui-tag.interactive:hover {
    filter: brightness(1.15);
  }

  /* colors（无边框时仍带 bg） */
  .ui-tag.color-default {
    color: var(--color-text-secondary);
    background-color: var(--color-bg-base);
    border-color: var(--color-border-secondary);
  }
  .ui-tag.color-primary {
    color: var(--color-primary);
    background-color: var(--color-primary-bg);
    border-color: var(--color-primary);
  }
  .ui-tag.color-success {
    color: var(--color-success);
    background-color: var(--color-success-bg);
    border-color: var(--color-success);
  }
  .ui-tag.color-warning {
    color: var(--color-warning);
    background-color: var(--color-warning-bg);
    border-color: var(--color-warning);
  }
  .ui-tag.color-error {
    color: var(--color-error);
    background-color: var(--color-error-bg);
    border-color: var(--color-error);
  }
  .ui-tag.color-info {
    color: var(--color-info);
    background-color: var(--color-info-bg);
    border-color: var(--color-info);
  }
  .ui-tag.color-accent {
    color: var(--color-accent);
    background-color: var(--color-accent-bg);
    border-color: var(--color-accent);
  }

  .ui-tag:not(.bordered) {
    border-color: transparent;
  }

  .close-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border: none;
    background: transparent;
    color: inherit;
    padding: 0;
    cursor: pointer;
    border-radius: 50%;
    opacity: 0.6;
    transition: opacity var(--motion-duration-fast) var(--motion-ease-base), background-color var(--motion-duration-fast) var(--motion-ease-base);
  }
  .close-btn:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.08);
  }
</style>
