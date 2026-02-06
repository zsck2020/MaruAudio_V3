<script>
  let { loading = false, rows = 8 } = $props();
</script>

{#if loading}
  <div class="page-loading">
    {#each Array(rows) as _}
      <div class="skeleton-line"></div>
    {/each}
  </div>
{:else}
  <slot />
{/if}

<style>
  .page-loading {
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
</style>
