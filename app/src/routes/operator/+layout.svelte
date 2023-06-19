<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_OPERATOR_PATH } from '$env/static/public';

  import { selectedAccount } from '$lib/util/web3';

  onMount(() => {
    selectedAccount.subscribe(async (account) => {
      if (account) {
        const operatorPath = urlJoin(
          window.location.origin,
          PUBLIC_OPERATOR_PATH,
          account.address
        );
        if (!$page.url.href.startsWith(operatorPath)) goto(operatorPath);
      }
    });
  });
</script>

<slot />
