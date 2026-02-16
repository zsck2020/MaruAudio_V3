<script lang="ts">
  import Icon from '../icons/Icon.svelte';
  import Tooltip from './Tooltip.svelte';

  let {
    icon,
    label,
    tooltip,
    active = false,
    isMobile = false,
    onclick
  }: {
    icon: string;
    label: string;
    tooltip: string;
    active?: boolean;
    isMobile?: boolean;
    onclick: () => void;
  } = $props();
</script>

<Tooltip text={tooltip} position={isMobile ? "top" : "right"} delay={100}>
  <div 
    class="menu-item" 
    class:active
    role="button"
    tabindex="0"
    onclick={onclick}
    onkeydown={(e) => e.key === 'Enter' && onclick()}
  >
    <div class="menu-icon">
      <Icon name={icon} size={20} color={active ? '#ffffff' : 'var(--color-text-tertiary)'} />
    </div>
    <div class="menu-text">{label}</div>
  </div>
</Tooltip>

<style>
  .menu-item {
    width: 52px;
    height: 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: all var(--transition-duration) var(--transition-timing);
    position: relative;
    -webkit-app-region: no-drag;
    gap: var(--spacing-xs);
    margin: 0 auto;
  }

  .menu-item:hover {
    background-color: var(--color-bg-spotlight);
  }

  .menu-item.active {
    background-color: var(--color-bg-spotlight);
  }

  .menu-item.active::before {
    content: '';
    position: absolute;
    left: -16px;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 32px;
    background-color: var(--color-bg-spotlight);
    border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
  }

  .menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }

  /* 强制统一左侧菜单图标的视觉大小并确保垂直居中 */
  .menu-icon :global(svg) {
    width: 20px !important;
    height: 20px !important;
    min-width: 20px !important;
    min-height: 20px !important;
    max-width: 20px !important;
    max-height: 20px !important;
    flex-shrink: 0;
    display: block;
    margin: 0 auto;
  }

  .menu-text {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    font-weight: 500;
    text-align: center;
    line-height: 1.2;
    letter-spacing: 0.5px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .menu-item.active .menu-text {
    color: #ffffff;
  }

  @media (max-width: 768px) {
    .menu-item {
      width: 100%;
      height: 60px;
    }

    .menu-item.active::before {
      display: none;
    }
    
    .menu-item.active {
      border-top: 2px solid var(--color-bg-spotlight);
    }
  }

  @media (max-width: 480px) {
    .menu-text {
      font-size: 10px;
    }
  }
</style>
