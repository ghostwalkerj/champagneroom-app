<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_AGENT_PATH } from '$env/static/public';

  import type { AgentDocumentType } from '$lib/models/agent';

  import { selectedAccount } from '$lib/util/web3';

  import AgentWallet from './AgentWallet.svelte';
  import TalentForm from './TalentForm.svelte';

  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  const agent = data.agent as AgentDocumentType;
  export let form: ActionData;

  onMount(() => {
    selectedAccount.subscribe(async (account) => {
      if (account) {
        const agentPath = urlJoin(
          window.location.origin,
          PUBLIC_AGENT_PATH,
          account.address
        );
        if (agentPath !== $page.url.href) goto(agentPath);
      }
    });
  });
</script>

{#if agent}
  <div class="min-h-full">
    <main class="p-10">
      <!-- Page header -->
      {#key agent}
        <div class="bg-black rounded-lg mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div class="font-semibold text-primary text-md leading-6">
            Agent Dashboard

            <button
              class="btn btn-sm"
              on:click={async () => {
                //const talent = await generateTalent(agent);
                //talents = [...talents, talent];
              }}>Create Data</button
            >
          </div>
          <div class="divider" />

          <div class="mx-auto grid gap-2 grid-cols-1 lg:grid-cols-2">
            <div class="p-1">
              <AgentWallet />
            </div>
            <!-- Talent viewing and adding -->
            <div class="p-1">
              <TalentForm {form} {agent} />
            </div>
            <!-- {#key talents}
              <div class="p-1 row-span-2">
                <TopTalent {talents} />
              </div>
              <div class="p-1 lg:col-span-2">
                <WeeklyBooking {talents} />
              </div>
              <div class="p-1 lg:col-span-2">
                <TalentTable {talents} />
              </div>
            {/key} -->
          </div>
        </div>
      {/key}
    </main>
  </div>
{/if}
