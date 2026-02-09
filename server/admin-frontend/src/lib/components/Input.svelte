<script lang="ts">
  import type { Snippet } from 'svelte';

  type InputType = 'text' | 'password' | 'number' | 'email' | 'tel' | 'url';
  type InputSize = 'small' | 'medium' | 'large';

  let {
    value = $bindable(''),
    type = 'text',
    id = undefined,
    name = undefined,
    placeholder = '',
    disabled = false,
    size = 'medium',
    prefixIcon = null,
    showPassword = false,
    ...rest
  }: {
    value?: string;
    type?: InputType;
    id?: string;
    name?: string;
    placeholder?: string;
    disabled?: boolean;
    size?: InputSize;
    prefixIcon?: Snippet | null;
    showPassword?: boolean;
    [key: string]: any;
  } = $props();
  
  let showPwd = $state(false);
  let inputType = $state('text');
  
  $effect(() => {
    // 保持内部状态与外部 props 同步（runes 模式下需要显式状态）
    type;
    showPassword;
    
    if (type !== 'password') {
      showPwd = false;
      inputType = type;
      return;
    }
    
    if (!showPassword) {
      showPwd = false;
      inputType = 'password';
      return;
    }
    
    inputType = showPwd ? 'text' : 'password';
  });
  
  function togglePassword() {
    if (type === 'password') {
      showPwd = !showPwd;
      inputType = showPwd ? 'text' : 'password';
    }
  }
</script>

<div class="input-wrapper input-{size}">
  {#if prefixIcon}
    <span class="input-prefix-icon">{prefixIcon}</span>
  {/if}
  <input
    {...rest}
    id={id}
    name={name}
    type={inputType}
    bind:value
    {placeholder}
    {disabled}
    class="input"
  />
  {#if type === 'password' && showPassword}
    <button type="button" class="input-suffix-icon" onclick={togglePassword}>
      {showPwd ? '隐' : '显'}
    </button>
  {/if}
</div>

<style>
  .input-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    width: 100%;
  }
  
  .input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 14px;
    transition: all 0.3s;
  }
  
  .input:focus {
    outline: none;
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
  
  .input:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
  
  .input-small {
    padding: 4px 8px;
    font-size: 12px;
  }
  
  .input-large {
    padding: 12px 16px;
    font-size: 16px;
  }
  
  .input-prefix-icon {
    position: absolute;
    left: 12px;
    color: #999;
  }
  
  .input-suffix-icon {
    position: absolute;
    right: 12px;
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: #999;
  }
  
  .input-wrapper:has(.input-prefix-icon) .input {
    padding-left: 36px;
  }
  
  .input-wrapper:has(.input-suffix-icon) .input {
    padding-right: 36px;
  }
</style>
