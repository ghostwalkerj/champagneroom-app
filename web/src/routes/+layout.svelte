<script lang="ts">
  import { browserType } from '$lib/stores';
  import { onMount } from 'svelte';
  import { UAParser } from 'ua-parser-js';
  import '../app.css';

  onMount(() => {
    if ($browserType == null) {
      const parser = new UAParser();
      let result = parser.getDevice();
      browserType.set(result.type);
    }
  });
</script>

<slot />
