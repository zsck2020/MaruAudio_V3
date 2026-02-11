<script lang="ts">
  import '../fonts.css';
  import '../app.css';
  import { onMount } from 'svelte';
  
  let isWeb = false;
  
  onMount(() => {
    // 检测是否在 web 环境（非 Tauri）
    isWeb = typeof window !== 'undefined' && !window.__TAURI__;
  });
</script>

<!-- 主窗体 -->
<div class="window-container" class:web={isWeb}>
<div class="window">
  <slot />
  </div>
</div>

<style>
  .window-container {
    display: flex;
    min-height: 100vh;
    min-width: 100vw;
    background-color: var(--color-bg-base);
    overflow: hidden;
  }
  
  .window {
    height: 100vh;
    width: 100vw;
    background-color: var(--color-bg-base);
    color: var(--color-text);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  
  /* Web 环境下的样式 */
  :global(body:has(.window-container)) {
    overflow: hidden;
  }
</style>
