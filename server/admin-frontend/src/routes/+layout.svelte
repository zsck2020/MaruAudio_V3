<script lang="ts">
  import '../app.css';
  import Message from '$lib/components/Message.svelte';
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  
  interface MessageItem {
    id: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }
  
  let messages: MessageItem[] = [];
  let { children }: { children?: Snippet } = $props();
</script>

<Message {messages} />

{#if children}
  {@render children()}
{/if}
