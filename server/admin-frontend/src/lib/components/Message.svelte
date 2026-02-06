<script>
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  
  export let messages = [];
  
  function removeMessage(id) {
    messages = messages.filter(m => m.id !== id);
  }
  
  onMount(() => {
    const handleShow = (e) => {
      messages = [...messages, e.detail];
    };
    
    const handleHide = (e) => {
      messages = messages.filter(m => m.id !== e.detail.id);
    };
    
    window.addEventListener('show-message', handleShow);
    window.addEventListener('hide-message', handleHide);
    
    return () => {
      window.removeEventListener('show-message', handleShow);
      window.removeEventListener('hide-message', handleHide);
    };
  });
</script>

<div class="message-container">
  {#each messages as msg (msg.id)}
    <div class="message message-{msg.type}" transition:fade>
      <span class="message-content">{msg.message}</span>
      <button class="message-close" on:click={() => removeMessage(msg.id)}>×</button>
    </div>
  {/each}
</div>

<style>
  .message-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .message {
    min-width: 300px;
    padding: 12px 16px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
  }
  
  .message-error {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    color: #ff4d4f;
  }
  
  .message-success {
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    color: #52c41a;
  }
  
  .message-warning {
    background: #fffbe6;
    border: 1px solid #ffe58f;
    color: #faad14;
  }
  
  .message-info {
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    color: #1890ff;
  }
  
  .message-content {
    flex: 1;
    font-size: 14px;
  }
  
  .message-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: inherit;
    opacity: 0.6;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .message-close:hover {
    opacity: 1;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>


  import { fade } from 'svelte/transition';
  
  export let messages = [];
  
  function removeMessage(id) {
    messages = messages.filter(m => m.id !== id);
  }
  
  onMount(() => {
    const handleShow = (e) => {
      messages = [...messages, e.detail];
    };
    
    const handleHide = (e) => {
      messages = messages.filter(m => m.id !== e.detail.id);
    };
    
    window.addEventListener('show-message', handleShow);
    window.addEventListener('hide-message', handleHide);
    
    return () => {
      window.removeEventListener('show-message', handleShow);
      window.removeEventListener('hide-message', handleHide);
    };
  });
</script>

<div class="message-container">
  {#each messages as msg (msg.id)}
    <div class="message message-{msg.type}" transition:fade>
      <span class="message-content">{msg.message}</span>
      <button class="message-close" on:click={() => removeMessage(msg.id)}>×</button>
    </div>
  {/each}
</div>

<style>
  .message-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .message {
    min-width: 300px;
    padding: 12px 16px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    animation: slideIn 0.3s ease-out;
  }
  
  .message-error {
    background: #fff2f0;
    border: 1px solid #ffccc7;
    color: #ff4d4f;
  }
  
  .message-success {
    background: #f6ffed;
    border: 1px solid #b7eb8f;
    color: #52c41a;
  }
  
  .message-warning {
    background: #fffbe6;
    border: 1px solid #ffe58f;
    color: #faad14;
  }
  
  .message-info {
    background: #e6f7ff;
    border: 1px solid #91d5ff;
    color: #1890ff;
  }
  
  .message-content {
    flex: 1;
    font-size: 14px;
  }
  
  .message-close {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: inherit;
    opacity: 0.6;
    padding: 0;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .message-close:hover {
    opacity: 1;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
</style>

