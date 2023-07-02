<script lang="ts">
  import spacetime from 'spacetime';
  import { uniqueNamesGenerator } from 'unique-names-generator';

  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  import { DisputeDecision } from '$lib/models/common';
  import type { OperatorDocumentType } from '$lib/models/operator';
  import type { ShowType } from '$lib/models/show';

  import { currencyFormatter } from '$lib/constants';
  import { womensNames } from '$lib/util/womensNames';

  import { nameStore } from '$stores';

  import type { PageData } from './$types';

  export let data: PageData;
  const operator = data.operator as OperatorDocumentType;
  let agents = data.agents;
  const disputedTickets = data.disputedTickets;

  nameStore.set(operator.user.name);

  $: canAddAgent = false;
  const decisions = Object.values(DisputeDecision);
  let decision = decisions[0];
  let activeTab = 'Agents' as 'Agents' | 'Disputes';
  let activeAgentRow = 0;
  let activeDisputeRow = 0;
  let isDecideDispute = false;

  let agentNameElement: HTMLTableCellElement;
  let agentAddressElement: HTMLTableCellElement;
  let agentName =
    'Agent ' +
    uniqueNamesGenerator({
      dictionaries: [womensNames]
    });
  let agentAddress = '';

  const decideDispute = async (decision: DisputeDecision) => {
    const index = activeDisputeRow;
    const ticket = disputedTickets[index];
    const show = ticket.show as unknown as ShowType;

    let formData = new FormData();
    formData.append('ticketId', ticket._id.toString());
    formData.append('decision', decision.toString());
    formData.append('showId', show._id.toString());
    fetch('?/decide_dispute', {
      method: 'POST',
      body: formData
    });

    disputedTickets.splice(index, 1);

    isDecideDispute = false;
  };

  const onSubmit = ({}) => {
    return async ({ result }) => {
      if (result?.type === 'success') {
        canAddAgent = false;
        await invalidateAll();
        agentName =
          'Agent ' +
          uniqueNamesGenerator({
            dictionaries: [womensNames]
          });
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
  <!-- Modal for Restarting or Ending Show -->
  {#if isDecideDispute}
    <input type="checkbox" id="changeUrl-show-modal" class="modal-toggle" />
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Dispute Decision</h3>
        <select
          class="select select-primary w-full max-w-xs"
          name="decision"
          bind:value={decision}
        >
          <option disabled selected>Decision</option>

          {#each decisions as decision}
            <option>{decision}</option>
          {/each}
        </select>
        <div class="modal-action">
          <button class="btn" on:click={() => (isDecideDispute = false)}
            >Cancel</button
          >
          <button class="btn" on:click={() => decideDispute(decision)}
            >Finalize</button
          >
        </div>
      </div>
    </div>
  {/if}
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
                            /><button
                              class="btn btn-xs btn-ghost p-0"
                              type="submit">Add</button
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
                        class:bg-base-300={activeAgentRow === index}
                        on:click={() => (activeAgentRow = index)}
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
                    <th>Run Time</th>
                    <th>Reason</th>
                    <th>Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {#each disputedTickets as ticket, index}
                    <tr
                      class:bg-base-300={activeDisputeRow === index}
                      on:click={() => (activeDisputeRow = index)}
                    >
                      <td>{index + 1}</td>
                      <td>{ticket.show.talentInfo.name}</td>
                      <td>{currencyFormatter.format(ticket.price)}</td>
                      <td
                        >{spacetime(
                          ticket.show.showState.runtime.startDate
                        ).format('nice')}</td
                      >
                      <td
                        >{spacetime(
                          ticket.show.showState.runtime.endDate
                        ).format('nice')}</td
                      >
                      <td
                        >{spacetime(
                          ticket.show.showState.runtime.startDate
                        ).diff(ticket.show.showState.runtime.endDate).minutes} min</td
                      >
                      <td>{ticket.ticketState.dispute?.reason}</td>
                      <td>{ticket.ticketState.dispute?.explanation}</td>
                      <td
                        ><button
                          class="btn btn-primary btn-xs"
                          on:click={() => (isDecideDispute = true)}
                          >Decide</button
                        ></td
                      >
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      {/key}
    </main>
  </div>
{/if}
