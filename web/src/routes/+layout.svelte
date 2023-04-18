<script lang="ts">
  import { browser } from '$app/environment';
  import { browserType } from '$lib/stores';
  import { UAParser } from 'ua-parser-js';
  import '../app.css';
  import { onMount } from 'svelte';

  onMount(() => {
    if ($browserType == null) {
      const parser = new UAParser();
      let result = parser.getDevice();
      browserType.set(result.type);
    }
  });
</script>

<slot />
