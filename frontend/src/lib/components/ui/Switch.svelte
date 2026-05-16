<script lang="ts" module>
  export type SwitchSize = 'sm' | 'md';
</script>

<script lang="ts">
  interface Props {
    checked?: boolean;
    disabled?: boolean;
    size?: SwitchSize;
    ariaLabel?: string;
    title?: string;
    onchange?: (checked: boolean) => void;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    size = 'md',
    ariaLabel,
    title,
    onchange,
  }: Props = $props();

  function toggle() {
    if (disabled) return;
    checked = !checked;
    onchange?.(checked);
  }

  function handleKey(event: KeyboardEvent) {
    if (disabled) return;
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      toggle();
    }
  }
</script>

<button
  type="button"
  class="ui-switch size-{size}"
  class:checked
  class:disabled
  role="switch"
  aria-checked={checked}
  aria-disabled={disabled}
  aria-label={ariaLabel}
  {title}
  {disabled}
  onclick={toggle}
  onkeydown={handleKey}
>
  <span class="thumb" aria-hidden="true"></span>
</button>

<style>
  .ui-switch {
    position: relative;
    display: inline-block;
    border: none;
    cursor: pointer;
    padding: 0;
    background-color: var(--color-border);
    transition: background-color var(--motion-duration-mid) var(--motion-ease-base);
  }

  .ui-switch.size-md {
    width: 36px;
    height: 20px;
    border-radius: 10px;
  }
  .ui-switch.size-sm {
    width: 28px;
    height: 16px;
    border-radius: 8px;
  }

  .ui-switch:focus-visible {
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }

  .ui-switch.checked {
    background-color: var(--color-primary);
  }

  .ui-switch.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }

  .thumb {
    position: absolute;
    top: 50%;
    left: 2px;
    transform: translateY(-50%);
    background-color: var(--color-bg-elevated);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
    border-radius: 50%;
    transition: left var(--motion-duration-mid) var(--motion-ease-out-back);
  }

  .ui-switch.size-md .thumb {
    width: 16px;
    height: 16px;
  }
  .ui-switch.size-sm .thumb {
    width: 12px;
    height: 12px;
  }

  .ui-switch.size-md.checked .thumb {
    left: 18px;
  }
  .ui-switch.size-sm.checked .thumb {
    left: 14px;
  }
</style>
