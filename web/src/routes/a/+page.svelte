<script lang="ts">
  import { agentDB } from '$lib/ORM/dbs/agentDB';
  import { getAgentId, type AgentDocument } from '$lib/ORM/models/agent';
  import type { TalentDocument } from '$lib/ORM/models/talent';
  import { generateTalent } from '$lib/util/dataHelper';
  import { onMount } from 'svelte';
  import { selectedAccount } from 'svelte-web3';
  import type { ActionData, PageData } from './$types';
  import AgentWallet from './AgentWallet.svelte';
  import TalentForm from './TalentForm.svelte';
  import TalentTable from './TalentTable.svelte';
  import TopTalent from './TopTalent.svelte';
  import WeeklyBooking from './WeeklyBooking.svelte';
  import {
    PUBLIC_AGENT_DB_ENDPOINT,
    PUBLIC_RXDB_PASSWORD,
  } from '$env/static/public';
  import { StorageType } from '$lib/ORM/rxdb';

  export let data: PageData;
  export let form: ActionData;
  const token = data.token;
  let agent: AgentDocument;
  let talents: TalentDocument[] = [];

  //TODO: This will be authentication later
  onMount(() => {
    selectedAccount.subscribe(async account => {
      if (account) {
        const agentId = getAgentId(account);
        const db = await agentDB(agentId, token, {
          endPoint: PUBLIC_AGENT_DB_ENDPOINT,
          storageType: StorageType.IDB,
          rxdbPassword: PUBLIC_RXDB_PASSWORD,
        });
        db?.agents
          .findOne(agentId)
          .exec()
          .then(_agent => {
            if (_agent) {
              agent = _agent;
              talents = [];
              agent.get$('talents').subscribe(_talents => {
                agent.populate('talents').then(_talents => {
                  talents = _talents;
                });
              });
            } else {
              console.log('Create new agent');
              let formData = new FormData();
              formData.append('account', account);
              fetch('?/create_agent', {
                method: 'POST',
                body: formData,
              }).then(res => {
                if (res.ok) {
                  res.json().then(_res => {
                    if (_res.success) {
                      agent = _res.agent;
                    }
                  });
                }
              });
            }
          });
      }
    });
  });
</script>

{#if agent}
  <div class="min-h-full">
    <main class="p-10">
      <!-- Page header -->
      {#key agent._id}
        <div class="bg-black rounded-lg mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div class="font-semibold text-primary text-md leading-6">
            Agent Dashboard

            <button
              class="btn btn-sm"
              on:click={async () => {
                const talent = await generateTalent(agent);
                talents = [...talents, talent];
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
            {#key talents}
              <div class="p-1 row-span-2">
                <TopTalent {talents} />
              </div>
              <div class="p-1 lg:col-span-2">
                <WeeklyBooking {talents} />
              </div>
              <div class="p-1 lg:col-span-2">
                <TalentTable {talents} />
              </div>
            {/key}
          </div>
        </div>
      {/key}
    </main>
  </div>
{:else}
  Loading Agent....
{/if}
