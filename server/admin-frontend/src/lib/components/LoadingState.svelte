<script>
  let {
    loading = false,
    empty = false,
    emptyText = '暂无数据',
    rows = 5,
    showAction = false,
    actionText = '刷新',
    onAction = () => {}
  } = $props();
</script>

{#if loading}
  <div class="loading-state">
    {#each Array(rows) as _}
      <div class="skeleton-line"></div>
    {/each}
  </div>
{:else if empty}
  <div class="empty-state">
    <div class="empty-icon">空</div>
    <p class="empty-text">{emptyText}</p>
    {#if showAction}
      <button class="empty-action" onclick={onAction} type="button">{actionText}</button>
    {/if}
  </div>
{:else}
  <slot />
{/if}

<style>
  .loading-state {
    padding: 20px;
  }
  
  .skeleton-line {
    height: 16px;
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s ease-in-out infinite;
    border-radius: 4px;
    margin-bottom: 12px;
  }
  
  .skeleton-line:last-child {
    width: 60%;
  }
  
  @keyframes loading {
    0% {
      background-position: 200% 0;
    }
    100% {
      background-position: -200% 0;
    }
  }
  
  .empty-state {
    padding: 40px 20px;
    text-align: center;
  }
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .empty-text {
    color: rgba(0, 0, 0, 0.45);
    margin: 0 0 16px 0;
  }
  
  .empty-action {
    padding: 8px 16px;
    background: #1890ff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
  }
  
  .empty-action:hover {
    background: #40a9ff;
  }
</style>
