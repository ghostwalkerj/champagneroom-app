<script lang="ts">
  import { browserType } from '$lib/stores';
  import { onMount } from 'svelte';
  import { UAParser } from 'ua-parser-js';
  import '../app.css';

  import { Agent } from '$lib/models/agent';
  import { Show } from '$lib/models/show';
  import { ShowEvent } from '$lib/models/showEvent';
  import { Talent } from '$lib/models/talent';
  import { Transaction } from '$lib/models/transaction';
  import { Ticket } from '$lib/models/ticket';

  globalThis.Talent = Talent;
  globalThis.Show = Show;
  globalThis.Agent = Agent;
  globalThis.ShowEvent = ShowEvent;
  globalThis.Transaction = Transaction;
  globalThis.Ticket = Ticket;

  onMount(() => {
    if ($browserType == null) {
      const parser = new UAParser();
      let result = parser.getDevice();
      browserType.set(result.type);
    }
  });
</script>

<slot />
