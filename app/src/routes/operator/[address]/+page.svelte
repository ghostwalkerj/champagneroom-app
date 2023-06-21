<script lang="ts">
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  import type { OperatorDocumentType } from '$lib/models/operator';

  import { nameStore } from '$stores';

  import type { PageData } from './$types';

  export let data: PageData;
  const operator = data.operator as OperatorDocumentType;
  let agents = data.agents;
  const disputedTickets = data.disputedTickets;
  $: canAddAgent = false;

  nameStore.set(operator.user.name);

  let activeTab = 'Agents' as 'Agents' | 'Disputes';
  let activeRow = 0;

  let agentNameElement: HTMLTableCellElement;
  let agentAddressElement: HTMLTableCellElement;
  let agentName = '';
  let agentAddress = '';

  const onSubmit = ({}) => {
    return async ({ result }) => {
      if (result?.type === 'success') {
        canAddAgent = false;
        await invalidateAll();
        agentName = '';
        agentAddress = '';
        agents = $page.data.agents;
      } else {
        if (result.data.badName) {
          agentNameElement.focus();
        }
        if (result.data.badAddress) {
          agentAddressElement.focus();
        }
      }
    };
  };
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
              {#key agents}
                <table class="table">
                  <thead>
                    <tr>
                      <th
                        ><button
                          class="btn btn-circle btn-xs"
                          on:click={() => {
                            canAddAgent = !canAddAgent;
                          }}
                        >
                          <iconify-icon
                            icon="mingcute:add-circle-line"
                            class="text-xl"
                          /></button
                        >
                      </th>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Active</th>
                      <th>Impersonate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {#if canAddAgent}
                      <tr>
                        <td>
                          <form
                            method="post"
                            action="?/create_agent"
                            use:enhance={onSubmit}
                          >
                            <input
                              type="hidden"
                              name="name"
                              value={agentName}
                            />
                            <input
                              type="hidden"
                              name="address"
                              value={agentAddress}
                            /><button class="btn btn-xs btn-ghost" type="submit"
                              >Add</button
                            >
                          </form>
                        </td>
                        <td
                          contenteditable="true"
                          bind:this={agentNameElement}
                          bind:innerText={agentName}
                        />
                        <td
                          contenteditable="true"
                          bind:this={agentAddressElement}
                          bind:innerText={agentAddress}
                        />

                        <td>True</td>
                        <td />
                      </tr>
                    {/if}
                    {#each agents as agent, index}
                      <tr
                        class:bg-base-300={activeRow === index}
                        on:click={() => (activeRow = index)}
                      >
                        <td>{index + 1}</td>
                        <td
                          contenteditable="true"
                          on:blur={(event) => {
                            console.log(event.target?.textContent);
                          }}>{agent.user.name}</td
                        >
                        <td contenteditable="true">{agent.user.address}</td>
                        <td>
                          <select
                            class="select select-bordered select-xs max-w-xs"
                          >
                            {#if agent.user.active}
                              <option value="true" selected>True</option>
                              <option value="false">False</option>
                            {:else}
                              <option value="true">True</option>
                              <option value="false" selected>False</option>
                            {/if}
                          </select>
                        </td>
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
              {/key}
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
