<script lang="ts" module>
  export type IconButtonVariant = 'default' | 'primary' | 'text' | 'danger';
  export type IconButtonSize = 'sm' | 'md' | 'lg';
  export type IconButtonShape = 'square' | 'circle';
</script>

<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';

  interface Props {
    icon: string;
    variant?: IconButtonVariant;
    size?: IconButtonSize;
    shape?: IconButtonShape;
    disabled?: boolean;
    loading?: boolean;
    active?: boolean;
    title?: string;
    ariaLabel?: string;
    onclick?: (event: MouseEvent) => void;
  }

  let {
    icon,
    variant = 'text',
    size = 'md',
    shape = 'square',
    disabled = false,
    loading = false,
    active = false,
    title,
    ariaLabel,
    onclick,
  }: Props = $props();

  let isDisabled = $derived(disabled || loading);
  const iconSizeMap: Record<IconButtonSize, number> = { sm: 12, md: 14, lg: 16 };
  let iconSize = $derived(iconSizeMap[size]);
</script>

<button
  type="button"
  class="ui-icon-btn variant-{variant} size-{size} shape-{shape}"
  class:active
  class:loading
  disabled={isDisabled}
  aria-busy={loading}
  aria-disabled={isDisabled}
  aria-label={ariaLabel ?? title ?? icon}
  {title}
  {onclick}
>
  {#if loading}
    <span class="spinner" aria-hidden="true"></span>
  {:else}
    <Icon name={icon} size={iconSize} color="currentColor" />
  {/if}
</button>

<style>
  .ui-icon-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 1px solid transparent;
    background: transparent;
    color: var(--color-text-tertiary);
    cursor: pointer;
    transition:
      background-color var(--motion-duration-mid) var(--motion-ease-base),
      color var(--motion-duration-mid) var(--motion-ease-base),
      border-color var(--motion-duration-mid) var(--motion-ease-base),
      transform var(--motion-duration-fast) var(--motion-ease-base);
  }

  .ui-icon-btn:focus-visible {
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }

  .ui-icon-btn:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  .ui-icon-btn:not(:disabled):active {
    transform: scale(0.94);
  }

  /* shape */
  .ui-icon-btn.shape-square { border-radius: var(--border-radius); }
  .ui-icon-btn.shape-circle { border-radius: 50%; }

  /* size */
  .ui-icon-btn.size-sm { width: var(--control-height-xs); height: var(--control-height-xs); }
  .ui-icon-btn.size-md { width: var(--control-height-sm); height: var(--control-height-sm); }
  .ui-icon-btn.size-lg { width: var(--control-height-md); height: var(--control-height-md); }

  /* variant */
  .ui-icon-btn.variant-default {
    border-color: var(--color-border);
    color: var(--color-text);
  }
  .ui-icon-btn.variant-default:not(:disabled):hover {
    border-color: var(--color-primary-hover);
    color: var(--color-primary-hover);
  }

  .ui-icon-btn.variant-primary {
    background-color: var(--color-primary);
    color: #fff;
  }
  .ui-icon-btn.variant-primary:not(:disabled):hover {
    background-color: var(--color-primary-hover);
  }

  .ui-icon-btn.variant-text:not(:disabled):hover {
    background-color: var(--color-hover-bg);
    color: var(--color-text);
  }
  .ui-icon-btn.variant-text.active {
    color: var(--color-primary);
    background-color: var(--color-primary-bg);
  }

  .ui-icon-btn.variant-danger {
    color: var(--color-error);
  }
  .ui-icon-btn.variant-danger:not(:disabled):hover {
    background-color: var(--color-error-bg);
    color: var(--color-error-hover);
  }

  .spinner {
    width: 12px;
    height: 12px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ui-icon-btn-spin 0.8s linear infinite;
  }

  @keyframes ui-icon-btn-spin {
    to { transform: rotate(360deg); }
  }
</style>
