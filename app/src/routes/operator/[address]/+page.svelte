<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_OPERATOR_PATH } from '$env/static/public';

  import type { OperatorDocumentType } from '$lib/models/operator';

  import { selectedAccount } from '$lib/util/web3';

  import type { PageData } from './$types';

  export let data: PageData;
  const operator = data.operator as OperatorDocumentType;

  onMount(() => {
    selectedAccount.subscribe(async account => {
      if (account) {
        const operatorPath = urlJoin(
          window.location.origin,
          PUBLIC_OPERATOR_PATH,
          account.address
        );
        if (operatorPath !== $page.url.href) goto(operatorPath);
      }
    });
  });
</script>

{#if operator}
  <div class="min-h-full">
    <main class="p-10">
      <!-- Page header -->
      {#key operator}
        <div class="bg-neutral rounded-lg mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div class="font-semibold text-primary text-md leading-6">
            Operator Dashboard
          </div>
          <div class="divider" />

          <div class="mx-auto grid gap-2 grid-cols-1 lg:grid-cols-2">
            <div class="p-1">Agents</div>
            <div class="p-1">Disputes</div>
          </div>
        </div>
      {/key}
    </main>
  </div>
{/if}
