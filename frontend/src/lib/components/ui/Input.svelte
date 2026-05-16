<script lang="ts" module>
  export type InputSize = 'sm' | 'md' | 'lg';
  export type InputType = 'text' | 'password' | 'email' | 'number' | 'search' | 'url' | 'tel';
</script>

<script lang="ts">
  import Icon from '$lib/icons/Icon.svelte';

  interface Props {
    value?: string;
    placeholder?: string;
    type?: InputType;
    size?: InputSize;
    disabled?: boolean;
    readonly?: boolean;
    error?: boolean;
    errorMessage?: string;
    prefixIcon?: string;
    suffixIcon?: string;
    clearable?: boolean;
    block?: boolean;
    maxLength?: number;
    ariaLabel?: string;
    onchange?: (value: string) => void;
    oninput?: (value: string) => void;
    onfocus?: (event: FocusEvent) => void;
    onblur?: (event: FocusEvent) => void;
    onenter?: () => void;
  }

  let {
    value = $bindable(''),
    placeholder = '',
    type = 'text',
    size = 'md',
    disabled = false,
    readonly = false,
    error = false,
    errorMessage = '',
    prefixIcon,
    suffixIcon,
    clearable = false,
    block = false,
    maxLength,
    ariaLabel,
    onchange,
    oninput,
    onfocus,
    onblur,
    onenter,
  }: Props = $props();

  let focused = $state(false);

  const iconSizeMap: Record<InputSize, number> = { sm: 12, md: 14, lg: 16 };
  let iconSize = $derived(iconSizeMap[size]);

  function handleInput(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
    oninput?.(value);
  }
  function handleChange(event: Event) {
    const target = event.target as HTMLInputElement;
    value = target.value;
    onchange?.(value);
  }
  function handleFocus(event: FocusEvent) {
    focused = true;
    onfocus?.(event);
  }
  function handleBlur(event: FocusEvent) {
    focused = false;
    onblur?.(event);
  }
  function handleKey(event: KeyboardEvent) {
    if (event.key === 'Enter') onenter?.();
  }
  function clear() {
    value = '';
    oninput?.('');
    onchange?.('');
  }
</script>

<div
  class="ui-input size-{size}"
  class:block
  class:focused
  class:error
  class:disabled
>
  {#if prefixIcon}
    <span class="adornment prefix" aria-hidden="true">
      <Icon name={prefixIcon} size={iconSize} color="currentColor" />
    </span>
  {/if}

  <input
    class="native"
    {type}
    {placeholder}
    {disabled}
    {readonly}
    maxlength={maxLength}
    aria-label={ariaLabel}
    aria-invalid={error}
    aria-errormessage={error && errorMessage ? 'ui-input-err' : undefined}
    {value}
    oninput={handleInput}
    onchange={handleChange}
    onfocus={handleFocus}
    onblur={handleBlur}
    onkeydown={handleKey}
  />

  {#if clearable && value && !disabled && !readonly}
    <button type="button" class="clear-btn" aria-label="清空" onclick={clear}>
      <Icon name="close" size={iconSize} color="currentColor" />
    </button>
  {/if}

  {#if suffixIcon}
    <span class="adornment suffix" aria-hidden="true">
      <Icon name={suffixIcon} size={iconSize} color="currentColor" />
    </span>
  {/if}
</div>

{#if error && errorMessage}
  <div class="error-text" id="ui-input-err" role="alert">{errorMessage}</div>
{/if}

<style>
  .ui-input {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background-color: var(--color-bg-base);
    border: 1px solid var(--color-border-secondary);
    border-radius: var(--border-radius);
    color: var(--color-text);
    padding: 0 10px;
    transition:
      border-color var(--motion-duration-mid) var(--motion-ease-base),
      box-shadow var(--motion-duration-mid) var(--motion-ease-base);
    min-width: 160px;
  }

  .ui-input.block { width: 100%; }

  .ui-input.size-sm { height: var(--control-height-xs); font-size: var(--font-size-sm); }
  .ui-input.size-md { height: var(--control-height-sm); font-size: var(--font-size); }
  .ui-input.size-lg { height: var(--control-height-md); font-size: var(--font-size-lg); }

  .ui-input:hover:not(.disabled):not(.error) {
    border-color: var(--color-primary-hover);
  }

  .ui-input.focused:not(.error) {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-focus-ring);
  }

  .ui-input.error {
    border-color: var(--color-error);
  }
  .ui-input.error.focused {
    box-shadow: 0 0 0 2px var(--color-error-bg);
  }

  .ui-input.disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
  .ui-input.disabled .native {
    cursor: not-allowed;
  }

  .adornment {
    display: inline-flex;
    align-items: center;
    color: var(--color-text-tertiary);
    flex-shrink: 0;
  }

  .native {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: inherit;
    font-family: inherit;
    font-size: inherit;
    min-width: 0;
    padding: 0;
  }
  .native::placeholder {
    color: var(--color-text-tertiary);
  }

  .clear-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border: none;
    background: transparent;
    color: var(--color-text-tertiary);
    cursor: pointer;
    padding: 0;
    border-radius: 50%;
    transition: background-color var(--motion-duration-fast) var(--motion-ease-base);
  }
  .clear-btn:hover {
    background-color: var(--color-hover-bg);
    color: var(--color-text);
  }

  .error-text {
    margin-top: 4px;
    font-size: var(--font-size-sm);
    color: var(--color-error);
  }
</style>
