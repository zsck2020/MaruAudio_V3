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

<Tooltip text={tooltip} position={isMobile ? 'top' : 'right'} delay={100}>
  <button
    type="button"
    class="menu-item"
    class:active
    aria-label={label}
    aria-pressed={active}
    onclick={onclick}
  >
    <div class="menu-icon">
      <Icon name={icon} size={20} color={active ? 'var(--color-text-active)' : 'var(--color-text-tertiary)'} />
    </div>
    <div class="menu-text">{label}</div>
  </button>
</Tooltip>

<style>
  .menu-item {
    width: 52px;
    height: 52px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--border-radius);
    background: transparent;
    cursor: pointer;
    transition: background-color var(--transition-duration) var(--transition-timing);
    position: relative;
    -webkit-app-region: no-drag;
    gap: var(--spacing-xs);
    margin: 0 auto;
  }

  .menu-item:hover,
  .menu-item.active {
    background-color: var(--color-bg-spotlight);
  }

  .menu-item:focus-visible {
    box-shadow: inset 0 0 0 1px var(--color-primary);
  }

  .menu-item::before {
    content: '';
    position: absolute;
    left: -16px;
    top: 50%;
    transform: translateY(-50%) scaleY(0);
    width: 4px;
    height: 32px;
    background-color: var(--color-primary);
    border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
    transition: transform var(--motion-duration-mid) var(--motion-ease-out);
  }

  .menu-item.active::before {
    transform: translateY(-50%) scaleY(1);
  }

  .menu-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 24px;
    height: 24px;
  }

  .menu-icon :global(svg) {
    flex-shrink: 0;
    display: block;
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
    color: var(--color-text-active);
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
      border-top: 2px solid var(--color-primary);
    }
  }

  @media (max-width: 480px) {
    .menu-text {
      font-size: 10px;
    }
  }
</style>
