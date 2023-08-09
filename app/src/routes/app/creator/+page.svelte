<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_CREATOR_PATH } from '$env/static/public';

  import { selectedAccount } from '$lib/util/web3';

  onMount(() => {
    const creatorBasePath = urlJoin(
      window.location.origin,
      PUBLIC_CREATOR_PATH
    );

    if (!$selectedAccount && $page.url.href !== creatorBasePath) {
      goto(creatorBasePath);
    }
    selectedAccount.subscribe(async (account) => {
      if (account) {
        const creatorFullPath = urlJoin(creatorBasePath, account.address);
        if ($page.url.href === creatorBasePath) {
          goto(creatorFullPath);
        } else if (!$page.url.href.startsWith(creatorFullPath)) {
          goto(creatorBasePath);
        }
      } else {
        goto(creatorBasePath);
      }
    });
  });
</script>
