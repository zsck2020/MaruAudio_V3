<script lang="ts" module>
  export type CardSize = 'sm' | 'md' | 'lg';
</script>

<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    title?: string;
    bordered?: boolean;
    hoverable?: boolean;
    size?: CardSize;
    extra?: Snippet;
    children?: Snippet;
    footer?: Snippet;
    ariaLabel?: string;
  }

  let {
    title = '',
    bordered = true,
    hoverable = false,
    size = 'md',
    extra,
    children,
    footer,
    ariaLabel,
  }: Props = $props();
</script>

<section
  class="ui-card size-{size}"
  class:bordered
  class:hoverable
  aria-label={ariaLabel}
>
  {#if title || extra}
    <header class="card-head">
      {#if title}<h3 class="card-title">{title}</h3>{/if}
      {#if extra}<div class="card-extra">{@render extra()}</div>{/if}
    </header>
  {/if}

  {#if children}
    <div class="card-body">
      {@render children()}
    </div>
  {/if}

  {#if footer}
    <footer class="card-footer">
      {@render footer()}
    </footer>
  {/if}
</section>

<style>
  .ui-card {
    display: flex;
    flex-direction: column;
    background-color: var(--color-bg-elevated);
    border-radius: var(--border-radius-lg);
    color: var(--color-text);
    overflow: hidden;
    transition:
      border-color var(--motion-duration-mid) var(--motion-ease-base),
      box-shadow var(--motion-duration-mid) var(--motion-ease-base),
      transform var(--motion-duration-mid) var(--motion-ease-base);
  }

  .ui-card.bordered {
    border: 1px solid var(--color-border-secondary);
  }

  .ui-card.hoverable {
    cursor: pointer;
  }
  .ui-card.hoverable:hover {
    border-color: var(--color-primary-hover);
    box-shadow: var(--shadow-2);
    transform: translateY(-1px);
  }

  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-md) var(--spacing-lg);
    border-bottom: 1px solid var(--color-split);
  }

  .ui-card.size-sm .card-head { padding: var(--spacing-sm) var(--spacing-md); }
  .ui-card.size-lg .card-head { padding: var(--spacing-lg) var(--spacing-xl); }

  .card-title {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-medium);
    color: var(--color-text);
  }
  .ui-card.size-sm .card-title { font-size: var(--font-size); }
  .ui-card.size-lg .card-title { font-size: var(--font-size-xl); }

  .card-extra {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-sm);
  }

  .card-body {
    padding: var(--spacing-lg);
    flex: 1;
  }
  .ui-card.size-sm .card-body { padding: var(--spacing-md); }
  .ui-card.size-lg .card-body { padding: var(--spacing-xl); }

  .card-footer {
    padding: var(--spacing-md) var(--spacing-lg);
    border-top: 1px solid var(--color-split);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
</style>
