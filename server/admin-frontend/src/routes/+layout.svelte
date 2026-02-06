<script>
  import '../app.css';
  import Message from '$lib/components/Message.svelte';
  import { onMount } from 'svelte';
  
  let messages = [];
</script>

<Message {messages} />

<slot />
