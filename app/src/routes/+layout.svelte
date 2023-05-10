<script lang="ts">
  import { browserType } from '$lib/stores';
  import { onMount } from 'svelte';
  import { UAParser } from 'ua-parser-js';
  import '../app.css';

  import { Talent } from '$lib/models/talent';
  import { Show } from '$lib/models/show';
  import { Agent } from '$lib/models/agent';
  import { ShowEvent } from '$lib/models/showEvent';
  import { Transaction } from '$lib/models/transaction';

  globalThis.Talent = Talent;
  globalThis.Show = Show;
  globalThis.Agent = Agent;
  globalThis.ShowEvent = ShowEvent;
  globalThis.Transaction = Transaction;

  onMount(() => {
    if ($browserType == null) {
      const parser = new UAParser();
      let result = parser.getDevice();
      browserType.set(result.type);
    }
  });
</script>

<slot />
