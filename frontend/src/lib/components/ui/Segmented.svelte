<script lang="ts" module>
  export interface SegmentOption {
    value: string;
    label: string;
  }
</script>

<script lang="ts">
  interface Props {
    value?: string;
    options: SegmentOption[];
    size?: 'sm' | 'md';
    disabled?: boolean;
    block?: boolean;
    ariaLabel?: string;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    options,
    size = 'md',
    disabled = false,
    block = false,
    ariaLabel,
    onchange,
  }: Props = $props();

  function select(v: string) {
    if (disabled || v === value) return;
    value = v;
    onchange?.(v);
  }
</script>

<div
  class="ui-segmented size-{size}"
  class:block
  class:disabled
  role="tablist"
  aria-label={ariaLabel}
>
  {#each options as opt (opt.value)}
    <button
      type="button"
      role="tab"
      aria-selected={value === opt.value}
      class="seg"
      class:active={value === opt.value}
      {disabled}
      onclick={() => select(opt.value)}
    >
      {opt.label}
    </button>
  {/each}
</div>

<style>
  .ui-segmented {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 2px;
    border-radius: var(--border-radius);
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
  }

  .ui-segmented.block {
    display: flex;
    width: 100%;
  }

  .seg {
    flex: 1;
    height: calc(var(--control-height) - 6px);
    padding: 0 var(--spacing-md);
    border: none;
    border-radius: var(--border-radius-sm);
    background: transparent;
    color: var(--color-text-secondary);
    font-family: inherit;
    font-size: var(--font-size-sm);
    white-space: nowrap;
    cursor: pointer;
    transition:
      background-color var(--motion-duration-mid) var(--motion-ease-base),
      color var(--motion-duration-mid) var(--motion-ease-base);
  }

  .ui-segmented.size-sm .seg {
    height: calc(var(--control-height-sm) - 6px);
    padding: 0 var(--spacing-sm);
    font-size: var(--font-size-xs);
  }

  .seg:hover:not(.active):not(:disabled) {
    color: var(--color-text);
    background-color: var(--color-hover-bg);
  }

  .seg.active {
    background-color: var(--color-primary);
    color: #fff;
  }

  .seg:focus-visible {
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }

  .ui-segmented.disabled {
    opacity: 0.55;
    pointer-events: none;
  }
</style>
