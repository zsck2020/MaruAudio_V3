<script lang="ts">
  import type { Snippet } from 'svelte';

  type ButtonType = 'default' | 'primary' | 'success' | 'warning' | 'danger';
  type ButtonSize = 'small' | 'medium' | 'large';

  let { 
    type = 'default',
    size = 'medium',
    loading = false,
    disabled = false,
    onClick = () => {},
    children
  }: {
    type?: ButtonType;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children?: Snippet;
  } = $props();
  
  let buttonClass = $derived(
    `btn btn-${type} btn-${size}${(loading || disabled) ? ' btn-disabled' : ''}`
  );
</script>

<button 
  class={buttonClass}
  disabled={disabled || loading}
  onclick={onClick}
  type="button"
>
  {#if loading}
    <span class="btn-loading">加载中...</span>
  {:else if children}
    {@render children()}
  {/if}
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px 16px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s;
    background: white;
    color: rgba(0, 0, 0, 0.85);
  }
  
  .btn:hover:not(.btn-disabled) {
    border-color: #40a9ff;
    color: #40a9ff;
  }
  
  .btn-primary {
    background: #1890ff;
    border-color: #1890ff;
    color: white;
  }
  
  .btn-primary:hover:not(.btn-disabled) {
    background: #40a9ff;
    border-color: #40a9ff;
  }
  
  .btn-success {
    background: #52c41a;
    border-color: #52c41a;
    color: white;
  }
  
  .btn-warning {
    background: #faad14;
    border-color: #faad14;
    color: white;
  }
  
  .btn-danger {
    background: #ff4d4f;
    border-color: #ff4d4f;
    color: white;
  }
  
  .btn-small {
    padding: 4px 12px;
    font-size: 12px;
  }
  
  .btn-large {
    padding: 12px 24px;
    font-size: 16px;
  }
  
  .btn-disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .btn-loading {
    opacity: 0.6;
  }
</style>
