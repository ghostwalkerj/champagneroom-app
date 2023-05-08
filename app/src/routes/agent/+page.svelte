<script lang="ts">
  import { onMount } from 'svelte';
  import { selectedAccount } from 'svelte-web3';
  import type { ActionData, PageData } from './$types';
  import AgentWallet from './AgentWallet.svelte';
  import TalentForm from './TalentForm.svelte';
  import TalentTable from './TalentTable.svelte';
  import TopTalent from './TopTalent.svelte';
  import WeeklyBooking from './WeeklyBooking.svelte';
  import type { Agent } from '$lib/ORM/schemas/agent';
  import type { Talent } from '$lib/ORM/schemas/talent';
  import { deserialize } from '$app/forms';

  export let data: PageData;
  export let form: ActionData;
  let agent: typeof Agent;
  let talents: (typeof Talent)[] = [];

  //TODO: This will be authentication later
  onMount(() => {
    selectedAccount.subscribe(async account => {
      if (account) {
        let formData = new FormData();
        formData.append('account', account);
        const response = await fetch('?/get_or_create_agent', {
          method: 'POST',
          body: formData,
        });

        const result = deserialize(await response.text());
        if (result.type === 'success' && result.data) {
          agent = result.data.agent;
        }
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

          <div
            class="mx-auto grid gap-2 grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          >
            <div class="p-1">
              <AgentWallet {agent} />
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
{:else}
  Loading Agent....
{/if}
