<script lang="ts" module>
  export type ButtonVariant = 'default' | 'primary' | 'text' | 'link' | 'danger' | 'ghost' | 'dashed';
  export type ButtonSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';
  import Icon from '$lib/icons/Icon.svelte';

  interface Props {
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    block?: boolean;
    prefixIcon?: string;
    suffixIcon?: string;
    iconOnly?: boolean;
    htmlType?: 'button' | 'submit' | 'reset';
    title?: string;
    ariaLabel?: string;
    onclick?: (event: MouseEvent) => void;
    children?: Snippet;
  }

  let {
    variant = 'default',
    size = 'md',
    loading = false,
    disabled = false,
    block = false,
    prefixIcon,
    suffixIcon,
    iconOnly = false,
    htmlType = 'button',
    title,
    ariaLabel,
    onclick,
    children,
  }: Props = $props();

  let isDisabled = $derived(disabled || loading);

  const iconSizeMap: Record<ButtonSize, number> = { sm: 12, md: 14, lg: 16 };
  let iconSize = $derived(iconSizeMap[size]);

  function handleClick(event: MouseEvent) {
    if (isDisabled) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    onclick?.(event);
  }
</script>

<button
  type={htmlType}
  class="ui-btn variant-{variant} size-{size}"
  class:block
  class:loading
  class:icon-only={iconOnly}
  disabled={isDisabled}
  aria-busy={loading}
  aria-disabled={isDisabled}
  aria-label={ariaLabel}
  {title}
  onclick={handleClick}
>
  {#if loading}
    <span class="spinner" aria-hidden="true"></span>
  {:else if prefixIcon}
    <Icon name={prefixIcon} size={iconSize} color="currentColor" />
  {/if}

  {#if children && !iconOnly}
    <span class="label"><svelte:boundary>{@render children()}</svelte:boundary></span>
  {/if}

  {#if !loading && suffixIcon}
    <Icon name={suffixIcon} size={iconSize} color="currentColor" />
  {/if}
</button>

<style>
  .ui-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px solid transparent;
    border-radius: var(--border-radius);
    font-family: inherit;
    font-weight: var(--font-weight-medium);
    cursor: pointer;
    user-select: none;
    transition:
      background-color var(--motion-duration-mid) var(--motion-ease-base),
      color var(--motion-duration-mid) var(--motion-ease-base),
      border-color var(--motion-duration-mid) var(--motion-ease-base),
      box-shadow var(--motion-duration-mid) var(--motion-ease-base),
      transform var(--motion-duration-fast) var(--motion-ease-base);
    white-space: nowrap;
    line-height: 1;
  }

  .ui-btn:focus-visible {
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }

  .ui-btn:disabled,
  .ui-btn[aria-disabled='true'] {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .ui-btn:not(:disabled):active {
    transform: scale(0.97);
  }

  .ui-btn.block {
    width: 100%;
  }

  /* ---- size · AntD 5: sm=24 / md=32 / lg=40 ---- */
  .ui-btn.size-sm {
    height: var(--control-height-sm);
    padding: 0 8px;
    font-size: var(--font-size-sm);
  }
  .ui-btn.size-md {
    height: var(--control-height);
    padding: 0 var(--spacing-md);
    font-size: var(--font-size);
  }
  .ui-btn.size-lg {
    height: var(--control-height-lg);
    padding: 0 var(--spacing-lg);
    font-size: var(--font-size-lg);
  }
  .ui-btn.icon-only {
    padding: 0;
    width: var(--control-height);
  }
  .ui-btn.icon-only.size-sm { width: var(--control-height-sm); }
  .ui-btn.icon-only.size-lg { width: var(--control-height-lg); }

  /* ---- default ---- */
  .ui-btn.variant-default {
    background-color: var(--color-bg-elevated);
    color: var(--color-text);
    border-color: var(--color-border);
  }
  .ui-btn.variant-default:not(:disabled):hover {
    color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }
  .ui-btn.variant-default:not(:disabled):active {
    color: var(--color-primary-active);
    border-color: var(--color-primary-active);
  }

  /* ---- primary ---- */
  .ui-btn.variant-primary {
    background-color: var(--color-primary);
    color: #fff;
    border-color: var(--color-primary);
  }
  .ui-btn.variant-primary:not(:disabled):hover {
    background-color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }
  .ui-btn.variant-primary:not(:disabled):active {
    background-color: var(--color-primary-active);
    border-color: var(--color-primary-active);
  }

  /* ---- dashed ---- */
  .ui-btn.variant-dashed {
    background-color: transparent;
    color: var(--color-text-secondary);
    border-color: var(--color-border);
    border-style: dashed;
  }
  .ui-btn.variant-dashed:not(:disabled):hover {
    color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  /* ---- text ---- */
  .ui-btn.variant-text {
    background-color: transparent;
    color: var(--color-text);
    border-color: transparent;
  }
  .ui-btn.variant-text:not(:disabled):hover {
    background-color: var(--color-hover-bg);
  }

  /* ---- link ---- */
  .ui-btn.variant-link {
    background-color: transparent;
    color: var(--color-primary);
    border-color: transparent;
    padding-left: 0;
    padding-right: 0;
  }
  .ui-btn.variant-link:not(:disabled):hover {
    color: var(--color-primary-hover);
  }

  /* ---- danger ---- */
  .ui-btn.variant-danger {
    background-color: var(--color-error);
    color: #fff;
    border-color: var(--color-error);
  }
  .ui-btn.variant-danger:not(:disabled):hover {
    background-color: var(--color-error-hover);
    border-color: var(--color-error-hover);
  }

  /* ---- ghost ---- */
  .ui-btn.variant-ghost {
    background-color: transparent;
    color: var(--color-text);
    border-color: var(--color-text);
  }
  .ui-btn.variant-ghost:not(:disabled):hover {
    color: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
  }

  /* ---- spinner ---- */
  .spinner {
    width: 14px;
    height: 14px;
    border: 2px solid currentColor;
    border-top-color: transparent;
    border-radius: 50%;
    animation: ui-btn-spin 0.8s linear infinite;
    display: inline-block;
  }

  @keyframes ui-btn-spin {
    to { transform: rotate(360deg); }
  }

  .label {
    display: inline-flex;
    align-items: center;
  }
</style>
