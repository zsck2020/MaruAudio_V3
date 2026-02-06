<script>
  let {
    visible = $bindable(false),
    title = '',
    width = '500px',
    showFooter = true
  } = $props();
  
  let dialogRef = $state(null);
  
  function handleClose() {
    visible = false;
  }
  
  function handleMaskClick(event) {
    if (event.target === dialogRef) {
      handleClose();
    }
  }

  function handleMaskKeydown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleMaskClick(event);
    }
  }
</script>

{#if visible}
  <div
    class="dialog-mask"
    bind:this={dialogRef}
    role="button"
    tabindex="0"
    aria-label="关闭对话框"
    onclick={handleMaskClick}
    onkeydown={handleMaskKeydown}
  >
    <div class="dialog-container" style="width: {width};">
      <div class="dialog-header">
        <h3 class="dialog-title">{title}</h3>
        <button class="dialog-close" onclick={handleClose} type="button">×</button>
      </div>
      <div class="dialog-body">
        <slot />
      </div>
      {#if showFooter}
        <div class="dialog-footer">
          <slot name="footer" />
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .dialog-mask {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }
  
  .dialog-container {
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    max-width: 90vw;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
  }
  
  .dialog-header {
    padding: 16px 20px;
    border-bottom: 1px solid #e8e8e8;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .dialog-title {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
  }
  
  .dialog-close {
    background: none;
    border: none;
    font-size: 24px;
    color: #999;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s;
  }
  
  .dialog-close:hover {
    color: #333;
  }
  
  .dialog-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }
  
  .dialog-footer {
    padding: 12px 20px;
    border-top: 1px solid #e8e8e8;
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
</style>
