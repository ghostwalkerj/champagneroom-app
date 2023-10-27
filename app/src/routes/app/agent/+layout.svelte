<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_AGENT_PATH } from '$env/static/public';

  import { selectedAccount } from '$lib/web3';

  onMount(() => {
    const agentBasePath = urlJoin(window.location.origin, PUBLIC_AGENT_PATH);

    if (!$selectedAccount && $page.url.href !== agentBasePath) {
      goto(agentBasePath);
    }
    selectedAccount.subscribe(async (account) => {
      if (account) {
        const agentFullPath = urlJoin(agentBasePath, account.address);
        if ($page.url.href === agentBasePath) {
          goto(agentFullPath);
        } else if (!$page.url.href.startsWith(agentFullPath)) {
          goto(agentBasePath);
        }
      } else {
        goto(agentBasePath);
      }
    });
  });
</script>

<slot />
