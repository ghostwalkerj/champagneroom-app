<script lang="ts">
  import { browserType } from '$stores';
  import 'iconify-icon';
  import { onMount } from 'svelte';
  import { UAParser } from 'ua-parser-js';
  import '../app.css';

  import { Agent } from '$lib/models/agent';
  import { Show } from '$lib/models/show';
  import { ShowEvent } from '$lib/models/showEvent';
  import { Talent } from '$lib/models/talent';
  import { Ticket } from '$lib/models/ticket';
  import { Transaction } from '$lib/models/transaction';

  globalThis.ShowEvent = ShowEvent;
  globalThis.Show = Show;
  globalThis.Agent = Agent;
  globalThis.Transaction = Transaction;
  globalThis.Ticket = Ticket;
  globalThis.Talent = Talent;

  onMount(() => {
    if ($browserType == undefined) {
      const parser = new UAParser();
      let result = parser.getDevice();
      browserType.set(result.type);
    }
  });
</script>

<slot />
