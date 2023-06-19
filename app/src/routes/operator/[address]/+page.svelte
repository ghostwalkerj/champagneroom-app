<script lang="ts">
  import type { OperatorDocumentType } from '$lib/models/operator';

  import { nameStore } from '$stores';

  import type { PageData } from './$types';

  export let data: PageData;
  const operator = data.operator as OperatorDocumentType;
  const agents = data.agents;
  const disputedTickets = data.disputedTickets;

  nameStore.set(operator.user.name);

  let activeTab = 'Agents' as 'Agents' | 'Disputes';
  let activeRow = 0;
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
          <!-- Tabs -->
          <div class="tabs tabs-boxed">
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a
              class="tab"
              class:tab-active={activeTab === 'Agents'}
              on:click={() => {
                activeTab = 'Agents';
              }}>Agents</a
            >

            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a
              class="tab"
              class:tab-active={activeTab == 'Disputes'}
              on:click={() => {
                activeTab = 'Disputes';
              }}>Disputes</a
            >
          </div>
        </div>

        <!-- Tables -->
        <div class="relative">
          <div
            class:invisible={activeTab !== 'Agents'}
            class="absolute top-4 left-0 bg-neutral w-full rounded-lg"
          >
            <div class="overflow-x-auto reo">
              <table class="table">
                <thead>
                  <tr>
                    <th />
                    <th>Name</th>
                    <th>Address</th>
                    <th>Active</th>
                    <th>Impersonate</th>
                  </tr>
                </thead>
                <tbody>
                  {#each agents as agent, index}
                    <tr
                      class:bg-base-300={activeRow === index}
                      on:click={() => (activeRow = index)}
                    >
                      <td>{index + 1}</td>
                      <td>{agent.user.name}</td>
                      <td>{agent.user.address}</td>
                      <td>{agent.user.active}</td>
                      <td
                        ><button
                          class="btn btn-primary btn-xs"
                          on:click={() => {}}>Impersonate</button
                        ></td
                      >
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
          <div
            class:invisible={activeTab !== 'Disputes'}
            class="absolute top-4 left-0 bg-neutral w-full rounded-lg"
          >
            <div class="overflow-x-auto">
              <table class="table">
                <thead>
                  <tr>
                    <th />
                    <th>Talent</th>
                    <th>Amount</th>
                    <th>Show Start</th>
                    <th>Show End</th>
                    <th>Reason</th>
                    <th>Explanation</th>
                  </tr>
                </thead>
              </table>
            </div>
          </div>
        </div>
      {/key}
    </main>
  </div>
{/if}
