<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_OPERATOR_PATH } from '$env/static/public';

  import { selectedAccount } from '$lib/web3';

  onMount(() => {
    const operatorBasePath = urlJoin(
      window.location.origin,
      PUBLIC_OPERATOR_PATH
    );

    if (!$selectedAccount && $page.url.href !== operatorBasePath) {
      goto(operatorBasePath);
    }
    selectedAccount.subscribe(async (account) => {
      if (account) {
        const operatorFullPath = urlJoin(operatorBasePath, account.address);
        if ($page.url.href === operatorBasePath) {
          goto(operatorFullPath);
        } else if (!$page.url.href.startsWith(operatorFullPath)) {
          goto(operatorBasePath);
        }
      } else {
        goto(operatorBasePath);
      }
    });
  });
</script>

<slot />
