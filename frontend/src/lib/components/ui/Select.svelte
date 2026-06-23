<script lang="ts" module>
  export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
  }
</script>

<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';

  interface Props {
    value?: string;
    options: SelectOption[];
    size?: 'sm' | 'md';
    disabled?: boolean;
    placeholder?: string;
    block?: boolean;
    ariaLabel?: string;
    class?: string;
    hideArrow?: boolean;
    onchange?: (value: string) => void;
  }

  let {
    value = $bindable(''),
    options,
    size = 'md',
    disabled = false,
    placeholder,
    block = false,
    ariaLabel,
    class: className = '',
    hideArrow = false,
    onchange,
  }: Props = $props();

  function handleChange(event: Event) {
    const v = (event.currentTarget as HTMLSelectElement).value;
    value = v;
    onchange?.(v);
  }
</script>

<div class="ui-select size-{size} {className}" class:block class:disabled class:no-arrow={hideArrow}>
  <select {value} {disabled} aria-label={ariaLabel} onchange={handleChange}>
    {#if placeholder}
      <option value="" disabled selected={!value}>{placeholder}</option>
    {/if}
    {#each options as opt (opt.value)}
      <option value={opt.value} disabled={opt.disabled}>{opt.label}</option>
    {/each}
  </select>
  {#if !hideArrow}
    <span class="ui-select-arrow" aria-hidden="true">
      <Icon name="down" size={12} color="currentColor" />
    </span>
  {/if}
</div>

<style>
  .ui-select {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-width: 96px;
  }

  .ui-select.block {
    display: flex;
    width: 100%;
  }

  .ui-select select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: var(--control-height-sm);
    padding: 0 30px 0 var(--spacing-sm);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    background-color: var(--color-bg-elevated);
    color: var(--color-text);
    font-family: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition:
      border-color var(--motion-duration-mid) var(--motion-ease-base),
      box-shadow var(--motion-duration-mid) var(--motion-ease-base);
  }

  .ui-select.size-sm select {
    height: var(--control-height-xs);
    font-size: var(--font-size-sm);
  }

  .ui-select.no-arrow select {
    padding-right: var(--spacing-sm);
  }

  .ui-select select:hover:not(:disabled) {
    border-color: var(--color-primary-hover);
  }

  .ui-select select:focus-visible {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }

  .ui-select.disabled select,
  .ui-select select:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  .ui-select-arrow {
    position: absolute;
    right: var(--spacing-sm);
    top: 50%;
    transform: translateY(-50%);
    display: inline-flex;
    pointer-events: none;
    color: var(--color-text-tertiary);
  }

  .ui-select option {
    background-color: var(--color-bg-popover);
    color: var(--color-text);
  }
</style>
