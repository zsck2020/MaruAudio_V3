<script lang="ts">
  import type { Snippet } from 'svelte';

  let { 
    title = '', 
    shadow = true,
    children
  }: { 
    title?: string; 
    shadow?: boolean;
    children?: Snippet;
  } = $props();
</script>

<div class="card" class:card-shadow={shadow}>
  {#if title}
    <div class="card-header">
      <h3 class="card-title">{title}</h3>
    </div>
  {/if}
  <div class="card-body">
    {#if children}
      {@render children()}
    {/if}
  </div>
</div>

<style>
  .card {
    background: white;
    border-radius: 8px;
    border: 1px solid #f0f0f0;
    overflow: hidden;
  }
  
  .card-shadow {
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px rgba(0, 0, 0, 0.02);
  }
  
  .card-header {
    padding: 16px 24px;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .card-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.85);
  }
  
  .card-body {
    padding: 24px;
  }
</style>
