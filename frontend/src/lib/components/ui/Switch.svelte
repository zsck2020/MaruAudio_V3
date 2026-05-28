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
    flex-shrink: 0;
    border: none;
    cursor: pointer;
    padding: 0;
    background-color: rgba(255, 255, 255, 0.25);
    transition: background-color var(--motion-duration-mid) var(--motion-ease-base);
    vertical-align: middle;
    user-select: none;
    line-height: 0;
    min-height: unset !important;
    min-width: unset;
  }

  .ui-switch.size-md {
    width: 44px;
    height: 22px;
    border-radius: 100px;
  }
  .ui-switch.size-sm {
    width: 28px;
    height: 16px;
    border-radius: 100px;
  }

  .ui-switch:focus-visible {
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }

  .ui-switch.checked {
    background-color: var(--color-primary);
  }

  .ui-switch.disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    background-color: #fff;
    box-shadow: 0 2px 4px 0 rgba(0, 35, 11, 0.2);
    border-radius: 50%;
    transition: left var(--motion-duration-mid) var(--motion-ease-base);
  }

  .ui-switch.size-md .thumb {
    width: 18px;
    height: 18px;
  }
  .ui-switch.size-sm .thumb {
    width: 12px;
    height: 12px;
  }

  .ui-switch.size-md.checked .thumb {
    left: calc(100% - 20px);
  }
  .ui-switch.size-sm.checked .thumb {
    left: calc(100% - 14px);
  }
</style>
