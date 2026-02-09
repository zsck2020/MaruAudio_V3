<script lang="ts">
  type SelectSize = 'small' | 'medium' | 'large';

  interface SelectOption {
    label: string;
    value: string | number;
  }

  let {
    value = $bindable(''),
    id = undefined,
    options = [],
    placeholder = '请选择',
    disabled = false,
    size = 'medium',
    onChange = () => {}
  }: {
    value?: string | number;
    id?: string;
    options?: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    size?: SelectSize;
    onChange?: (option: SelectOption) => void;
  } = $props();
  
  let open = $state(false);
  let selectRef: HTMLElement | undefined;
  
  function toggle() {
    if (!disabled) {
      open = !open;
    }
  }

  function handleTriggerKeydown(event: KeyboardEvent) {
    if (disabled) return;

    if (event.key === 'Escape') {
      open = false;
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggle();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      open = true;
    }
  }
  
  
  function handleClickOutside(event: MouseEvent) {
    if (selectRef && !selectRef.contains(event.target as Node)) {
      open = false;
    }
  }
  
  $effect(() => {
    if (open) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  });
  
  let selectedLabel = $derived(options.find(opt => opt.value === value)?.label || placeholder);
  
  function handleChange(option: SelectOption) {
    value = option.value;
    open = false;
    onChange(option);
    // 兼容旧逻辑：触发全局事件（不建议依赖）
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('select-change', { detail: option }));
    }
  }
</script>

<div class="select-wrapper select-{size}" bind:this={selectRef}>
  <button
    type="button"
    {id}
    class="select-input"
    class:select-disabled={disabled}
    class:select-open={open}
    disabled={disabled}
    aria-haspopup="listbox"
    aria-expanded={open}
    onclick={toggle}
    onkeydown={handleTriggerKeydown}
  >
    <span class="select-value" class:select-placeholder={!value}>
      {selectedLabel}
    </span>
    <span class="select-arrow">▼</span>
  </button>
  {#if open}
    <div class="select-dropdown" role="listbox">
      {#each options as option}
        <button
          type="button"
          class="select-option"
          class:select-option-selected={value === option.value}
          role="option"
          aria-selected={value === option.value}
          onclick={() => handleChange(option)}
        >
          {option.label}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .select-wrapper {
    position: relative;
    display: inline-block;
    width: 100%;
  }
  
  .select-input {
    text-align: left;
    width: 100%;
    padding: 8px 32px 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    background: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: all 0.3s;
  }
  
  .select-input:hover:not(.select-disabled) {
    border-color: #40a9ff;
  }
  
  .select-input.select-open {
    border-color: #40a9ff;
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
  }
  
  .select-disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
  
  .select-value {
    flex: 1;
    font-size: 14px;
    color: rgba(0, 0, 0, 0.85);
  }
  
  .select-placeholder {
    color: #999;
  }
  
  .select-arrow {
    font-size: 12px;
    color: #999;
    transition: transform 0.3s;
  }
  
  .select-open .select-arrow {
    transform: rotate(180deg);
  }
  
  .select-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid #d9d9d9;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    max-height: 300px;
    overflow-y: auto;
  }
  
  .select-option {
    padding: 8px 12px;
    cursor: pointer;
    font-size: 14px;
    transition: background 0.2s;
    width: 100%;
    text-align: left;
    border: none;
    background: none;
  }
  
  .select-option:hover {
    background: #f5f5f5;
  }
  
  .select-option-selected {
    background: #e6f7ff;
    color: #1890ff;
  }
  
  .select-small .select-input {
    padding: 4px 28px 4px 8px;
    font-size: 12px;
  }
  
  .select-large .select-input {
    padding: 12px 36px 12px 16px;
    font-size: 16px;
  }
</style>
