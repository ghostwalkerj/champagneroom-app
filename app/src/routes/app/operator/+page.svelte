<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import { ObjectId } from 'mongodb';
  import spacetime from 'spacetime';
  import StarRating from 'svelte-star-rating';
  import { uniqueNamesGenerator } from 'unique-names-generator';
  import urlJoin from 'url-join';

  import { deserialize, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  import type { AgentDocumentType } from '$lib/models/agent';
  import { DisputeDecision } from '$lib/models/common';
  import type { CreatorDocumentType } from '$lib/models/creator';
  import type { OperatorDocumentType } from '$lib/models/operator';
  import type { ShowDocument } from '$lib/models/show';

  import Config from '$lib/config';
  import { AuthType, currencyFormatter } from '$lib/constants';
  import { womensNames } from '$lib/womensNames';

  import type { PageData } from './$types';

  export let data: PageData;
  const operator = data.operator as OperatorDocumentType;
  let agents = data.agents as AgentDocumentType[];
  let creators = data.creators as CreatorDocumentType[];

  const disputedTickets = data.disputedTickets;

  $: canAddAgent = false;
  $: canAddCreator = false;
  const decisions = Object.values(DisputeDecision);
  let decision = decisions[0];
  let activeTab = 'Admin' as 'Admin' | 'Agents' | 'Creators' | 'Disputes';
  let activeAgentRow = 0;
  let activeCreatorRow = 0;
  let activeDisputeRow = 0;
  let isDecideDispute = false;

  let agentNameElement: HTMLTableCellElement;
  let agentAddressElement: HTMLTableCellElement;
  let creatorAgentElement: HTMLSelectElement;
  let newCreatorModal: HTMLDialogElement;

  let agentName =
    'Agent ' +
    uniqueNamesGenerator({
      dictionaries: [womensNames]
    });
  let agentAddress = '';
  let creatorNameElement: HTMLTableCellElement;
  let creatorCommissionElement: HTMLTableCellElement;
  let commission = Config.UI.defaultCommission;
  let creatorName = uniqueNamesGenerator({
    dictionaries: [womensNames]
  });
  let isChangeCreatorSecret = false;
  let selectedAgentId = '0';
  let newCreator: CreatorDocumentType | undefined;
  let newPassword: string | undefined;

  const decideDispute = async (decision: DisputeDecision) => {
    const index = activeDisputeRow;
    const ticket = disputedTickets[index];
    const show = ticket.show as unknown as ShowDocument;

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

  const changeUserSecret = async () => {
    const index = activeCreatorRow;
    const userId = creators[index].user._id.toString();
    let formData = new FormData();
    formData.append('userId', userId);
    const response = await fetch('?/change_user_secret', {
      method: 'POST',
      body: formData
    });
    const result: ActionResult = deserialize(await response.text());
    if (result.type === 'success' && result.data) {
      creators[index].user.secret = result.data.secret;
    }

    isChangeCreatorSecret = false;
  };

  const updateCreator = async (
    index: number,
    {
      name,
      commission,
      active,
      agentId
    }: {
      name?: string;
      commission?: number;
      active?: boolean;
      agentId?: string;
    }
  ) => {
    const creator = creators[index];
    let formData = new FormData();
    formData.append('creatorId', creator._id.toString());
    formData.append('name', name || creator.user.name);
    formData.append(
      'commission',
      commission ? commission.toString() : creator.agentCommission.toString()
    );
    formData.append(
      'active',
      active ? active.toString() : creator.user.active.toString()
    );
    if (agentId) {
      formData.append('agentId', agentId);
    } else {
      formData.append('agentId', '');
    }

    await fetch('?/update_creator', {
      method: 'POST',
      body: formData
    });
  };

  const updateCreatorName = (name: string) => {
    creators[activeCreatorRow].user.name = name;
    updateCreator(activeCreatorRow, { name });
  };

  const updateCommission = (commission: number) => {
    creators[activeCreatorRow].agentCommission = commission;
    updateCreator(activeCreatorRow, { commission });
  };

  const updateCreatorActive = (active: string) => {
    creators[activeCreatorRow].user.active = active == 'true' ? true : false;
    updateCreator(activeCreatorRow, {
      active: creators[activeCreatorRow].user.active
    });
  };

  const updateCreatorAgent = (agentId: string) => {
    const agent = new ObjectId(agentId);
    creators[activeCreatorRow].agent = agent;
    updateCreator(activeCreatorRow, { agentId });
  };

  const getAgentName = (agentId: ObjectId) => {
    const agent = agents.find((agent) => agent._id == agentId);
    return agent?.user.name;
  };

  const onSubmit = ({}) => {
    return async ({ result }) => {
      if (result?.type === 'success') {
        canAddAgent = false;
        canAddCreator = false;
        await invalidateAll();
        if (result.data.agentCreated) {
          agentName =
            'Agent ' +
            uniqueNamesGenerator({
              dictionaries: [womensNames]
            });
          agentAddress = '';
          agents = $page.data.agents;
        }
        if (result.data.creatorCreated) {
          creatorName =
            'Creator ' +
            uniqueNamesGenerator({
              dictionaries: [womensNames]
            });
          creators = $page.data.creators;
          newCreator = result.data.creator;
          newPassword = result.data.password;
          newCreatorModal.showModal();
        }
      } else {
        if (result.data.badAgentName) {
          agentNameElement.focus();
        }
        if (result.data.badAgentAddress) {
          agentAddressElement.focus();
        }
        if (result.data.badCommission) {
          creatorCommissionElement.focus();
        }
        if (result.data.missingAgentId) {
          creatorAgentElement.focus();
        }
      }
    };
  };
</script>

<dialog id="new_creator_modal" class="modal" bind:this={newCreatorModal}>
  <div class="modal-box">
    {#if newCreator}
      <h3 class="font-bold text-lg text-center mb-6">New Creator</h3>
      <div class="text-center">
        {newCreator.user.name} has been created with the following password:
        <div class="text-center font-bold text-lg">{newPassword}</div>
      </div>
      <div class="text-center mt-4">
        and secret URL:
        <div class="text-center font-bold text-sm">
          <a
            href={urlJoin(Config.Path.creator, newCreator.user.secret)}
            target="_blank"
            class="link link-primary"
          >
            {urlJoin(Config.Path.creator, newCreator.user.secret)}</a
          >
        </div>
      </div>

      <div class="modal-action">
        <form method="dialog">
          <!-- if there is a button in form, it will close the modal -->
          <button class="btn">Close</button>
        </form>
      </div>
    {/if}
  </div>
</dialog>

{#if operator}
  <!-- Modal for Deciding Dispute -->
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

  {#if isChangeCreatorSecret}
    <input type="checkbox" id="changeUrl-show-modal" class="modal-toggle" />
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Change Secret URL</h3>
        <p class="py-4">
          Changing the Creator's Secret URL will disable the current URL and
          create a new one.
        </p>
        <div class="modal-action">
          <button class="btn" on:click={() => (isChangeCreatorSecret = false)}
            >Cancel</button
          >
          <button class="btn" on:click={changeUserSecret}>Change</button>
        </div>
      </div>
    </div>
  {/if}

  <div class="">
    <main class="p-10">
      <!-- Page header -->
      {#key operator}
        <div
          class="bg-base border-2 border-secondary rounded-lg mx-auto p-4 sm:px-6 lg:px-8"
        >
          <div class="font-semibold text-primary text-lg leading-6">
            Operator Dashboard
          </div>
          <div class="divider" />
          <!-- Tabs -->
          <div class="tabs tabs-boxed w-fit">
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a
              class="tab"
              class:tab-active={activeTab === 'Admin'}
              on:click={() => {
                activeTab = 'Admin';
              }}>Admin</a
            >

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
              class:tab-active={activeTab === 'Creators'}
              on:click={() => {
                activeTab = 'Creators';
              }}>Creators</a
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
        <div class="min-h-screen">
          <div class="relative">
            {#if activeTab === 'Admin'}
              <div
                class="mt-4 bg-base w-full rounded-lg z-0 border-2 border-secondary"
              >
                <div class="mx-auto p-4 ml-2">
                  <ul
                    class="menu menu-vertical lg:menu-horizontal bg-base-200 rounded-box"
                  >
                    <li>
                      <!--  eslint-disable-next-line svelte/valid-compile,
                      svelte/valid-compile -->
                      <!-- svelte-ignore a11y-missing-attribute -->
                      <a class="font-SpaceGrotesk">
                        <iconify-icon
                          icon="mdi:teleconference"
                          class="w-6 h-6 mt-2"
                        />
                        Create Conference</a
                      >
                    </li>
                  </ul>
                </div>
              </div>
            {:else if activeTab === 'Agents'}
              <div
                class="mt-4 bg-base w-full rounded-lg z-0 overflow-hidden border-2 border-secondary"
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
            {:else if activeTab === 'Creators'}
              <div
                class="mt-4 bg-base w-full rounded-lg z-0 overflow-hidden border-2 border-secondary"
              >
                <div class="overflow-x-auto">
                  {#key creators}
                    <table class="table table-pin-rows">
                      <thead>
                        <tr>
                          <th
                            ><button
                              class="btn btn-circle btn-xs"
                              on:click={() => {
                                canAddCreator = !canAddCreator;
                              }}
                            >
                              <iconify-icon
                                icon="mingcute:add-circle-line"
                                class="text-xl"
                              /></button
                            >
                          </th>
                          <th>Name</th>
                          <th>Agent</th>
                          <th>Comm %</th>
                          <th>Active</th>
                          <th>Secret</th>
                          <th>Ticket Sales</th>
                          <th>Revenue</th>
                          <th>Refunds</th>
                          <th>Reviews</th>
                          <th>Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#if canAddCreator}
                          <tr>
                            <td>
                              <form
                                method="post"
                                action="?/create_creator"
                                use:enhance={onSubmit}
                              >
                                <input
                                  type="hidden"
                                  name="name"
                                  value={creatorName}
                                />

                                <input
                                  type="hidden"
                                  name="agentId"
                                  value={selectedAgentId}
                                />

                                <input
                                  type="hidden"
                                  name="commission"
                                  value={commission}
                                />
                                <button
                                  class="btn btn-xs btn-ghost p-0"
                                  type="submit">Add</button
                                >
                              </form>
                            </td>
                            <td
                              contenteditable="true"
                              bind:this={creatorNameElement}
                              bind:innerText={creatorName}
                            />
                            <td>
                              <select
                                class="select select-bordered select-xs max-w-xs"
                                bind:value={selectedAgentId}
                                bind:this={creatorAgentElement}
                              >
                                <option disabled value="0" selected
                                  >Select Agent</option
                                >
                                {#each agents as agent}
                                  <option value={agent._id.toString()}
                                    >{agent.user.name}</option
                                  >
                                {/each}
                              </select>
                            </td>

                            <td
                              contenteditable="true"
                              bind:this={creatorCommissionElement}
                              bind:innerText={commission}
                            />
                            <td>True</td>
                            <td />
                          </tr>
                        {/if}
                        {#each creators as creator, index}
                          {@const agentId = creator.agent}
                          {@const agentName =
                            (agentId && getAgentName(agentId)) || 'None'}
                          <tr
                            class:bg-base-300={activeCreatorRow === index}
                            on:click={() => (activeCreatorRow = index)}
                          >
                            <td>{index + 1}</td>
                            <td
                              contenteditable="true"
                              on:blur={(event) => {
                                updateCreatorName(event.target?.textContent);
                              }}>{creator.user.name}</td
                            >
                            <td>
                              {#if agentId}
                                <select
                                  class="select select-bordered select-xs max-w-xs"
                                  on:change={(event) => {
                                    updateCreatorAgent(event.target?.value);
                                  }}
                                >
                                  <option value={agentId.toString()} selected
                                    >{agentName}</option
                                  >
                                  {#each agents as agent}
                                    {#if agent._id.toString() !== agentId.toString()}
                                      <option value={agent._id.toString()}
                                        >{agent.user.name}</option
                                      >
                                    {/if}
                                  {/each}
                                </select>
                              {:else}
                                None
                              {/if}
                            </td>
                            <td
                              contenteditable="true"
                              on:blur={(event) => {
                                updateCommission(event.target?.textContent);
                              }}>{creator.agentCommission}</td
                            >
                            <td>
                              <select
                                class="select select-bordered select-xs max-w-xs"
                                on:change={(event) => {
                                  updateCreatorActive(event.target?.value);
                                }}
                              >
                                {#if creator.user.active}
                                  <option value="true" selected>True</option>
                                  <option value="false">False</option>
                                {:else}
                                  <option value="true">True</option>
                                  <option value="false" selected>False</option>
                                {/if}
                              </select>
                            </td>
                            <td
                              >{#if creator.user.authType !== AuthType.SIGNING}<a
                                  href={urlJoin(
                                    Config.Path.creator,
                                    creator.user.secret
                                  )}
                                  target="_blank"
                                  class="link link-primary">Secret Url</a
                                >
                                <button
                                  class="btn btn-xs btn-outline btn-primary ml-4"
                                  on:click={() =>
                                    (isChangeCreatorSecret = true)}
                                >
                                  Change
                                </button>
                              {:else}
                                N/A
                              {/if}
                            </td>

                            <td>
                              {#each Object.entries(creator.salesStats.totalTicketSalesAmounts) as [currency, amount]}
                                {currencyFormatter(currency).format(amount)}
                              {/each}
                            </td>
                            <td>
                              {#each Object.entries(creator.salesStats.totalRevenue) as [currency, amount]}
                                {currencyFormatter(currency).format(amount)}
                              {/each}
                            </td>
                            <td>
                              {#each Object.entries(creator.salesStats.totalRefunds) as [currency, amount]}
                                {currencyFormatter(currency).format(amount)}
                              {/each}
                            </td>
                            <td>{creator.feedbackStats.numberOfReviews}</td>
                            <td
                              class="tooltip"
                              data-tip={creator.feedbackStats.averageRating.toFixed(
                                2
                              )}
                            >
                              <StarRating
                                rating={creator.feedbackStats.averageRating}
                              />
                            </td>
                          </tr>
                        {/each}
                      </tbody>
                      <tfoot>
                        <tr>
                          <th />
                          <th>Name</th>
                          <th>Agent</th>
                          <th>Comm %</th>
                          <th>Active</th>
                          <th>Secret</th>
                          <th>Sales</th>
                          <th>Revenue</th>
                          <th>Refunds</th>
                          <th>Reviews</th>
                          <th>Rating</th>
                        </tr>
                      </tfoot>
                    </table>
                  {/key}
                </div>
              </div>
            {:else}
              <div
                class="mt-4 bg-base w-full rounded-lg z-0 overflow-hidden border-2 border-secondary"
              >
                <div class="overflow-x-auto">
                  <table class="table">
                    <thead>
                      <tr>
                        <th />
                        <th>Creator</th>
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
                        {@const runtime = ticket.show.showState.runtime}
                        {#if runtime}
                          <tr
                            class:bg-base-300={activeDisputeRow === index}
                            on:click={() => (activeDisputeRow = index)}
                          >
                            <td>{index + 1}</td>
                            <td>{ticket.show.creatorInfo.name}</td>
                            <td
                              >{currencyFormatter(ticket.price.currency).format(
                                ticket.price.amount
                              )}</td
                            >
                            <td
                              >{spacetime(runtime.startDate || '').format(
                                'nice'
                              )}</td
                            >
                            <td>{spacetime(runtime.endDate).format('nice')}</td>
                            <td
                              >{spacetime(runtime.startDate).diff(
                                runtime.endDate ?? spacetime.now()
                              ).minutes}
                              min</td
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
                        {/if}
                      {/each}
                    </tbody>
                  </table>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/key}
    </main>
  </div>
{/if}
