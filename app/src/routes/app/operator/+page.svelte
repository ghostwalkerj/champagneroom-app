<script lang="ts">
  import Icon from '@iconify/svelte';
  import {
    getModalStore,
    type ModalSettings,
    Ratings,
    Tab,
    TabGroup
  } from '@skeletonlabs/skeleton';
  import type { ActionResult } from '@sveltejs/kit';
  import { Types } from 'mongoose';
  import spacetime from 'spacetime';
  import { uniqueNamesGenerator } from 'unique-names-generator';
  import urlJoin from 'url-join';

  import { applyAction, deserialize, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  import type { AgentDocument } from '$lib/models/agent';
  import type { CreatorDocument } from '$lib/models/creator';
  import type { OperatorDocument } from '$lib/models/operator';
  import type { TicketDocument } from '$lib/models/ticket';
  import type { UserDocument } from '$lib/models/user';

  import config from '$lib/config';
  import type { DisputeDecision } from '$lib/constants';
  import { AuthType, currencyFormatter } from '$lib/constants';
  import { PermissionType } from '$lib/permissions';
  import { womensNames } from '$lib/womensNames';

  import CopyText from '$components/CopyText.svelte';

  import type { PageData } from './$types';

  export let data: PageData;
  let operator = data.operator as OperatorDocument;
  let agents = data.agents as AgentDocument[];
  let creators = data.creators as CreatorDocument[];
  let user = data.user as UserDocument;
  let disputedTickets = data.disputedTickets as TicketDocument[];

  $: canAddAgent = false;
  $: canAddCreator = false;
  let activeAgentRow = 0;
  let activeCreatorRow = 0;
  let activeDisputeRow = 0;

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
  let commission = config.UI.defaultCommissionRate.toString();
  let creatorName = uniqueNamesGenerator({
    dictionaries: [womensNames]
  });
  let selectedAgentId = '0';
  let newCreator: CreatorDocument | undefined;
  let newPassword: string | undefined;
  let tabSet: number = 0;
  const modalStore = getModalStore();

  const canImpersonateCreator = user.permissions.includes(
    PermissionType.IMPERSONATE_CREATOR
  );

  const canImpersonateAgent = user.permissions.includes(
    PermissionType.IMPERSONATE_AGENT
  );

  const decideDispute = async (decision: DisputeDecision) => {
    if (!decision) return;
    const index = activeDisputeRow;
    const ticket = disputedTickets[index];
    let formData = new FormData();
    formData.append('ticketId', ticket._id.toString());
    formData.append('decision', decision.toString());
    formData.append('showId', ticket.show._id.toString());
    fetch('?/decide_dispute', {
      method: 'POST',
      body: formData
    });

    disputedTickets.splice(index, 1);
  };

  const impersonate = async (impersonateId: string) => {
    let formData = new FormData();
    formData.append('impersonateId', impersonateId);
    const response = await fetch('?/impersonateUser', {
      method: 'POST',
      body: formData
    });
    const result: ActionResult = deserialize(await response.text());
    applyAction(result);
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
      const userSecretModal: ModalSettings = {
        type: 'component',
        component: 'UserSecret',
        meta: {
          user: creators[index].user,
          password: result.data!.password
        }
      };
      modalStore.trigger(userSecretModal);
    }
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
      agentId?: Types.ObjectId;
    }
  ) => {
    const creator = creators[index];
    let formData = new FormData();
    formData.append('creatorId', creator._id.toString());
    formData.append('name', name || creator.user.name);
    formData.append(
      'commission',
      commission ? commission.toString() : creator.commissionRate.toString()
    );
    formData.append('userId', creator.user._id.toString());
    formData.append(
      'active',
      active ? active.toString() : creator.user.active.toString()
    );
    if (agentId) {
      formData.append('agentId', agentId.toString());
    }

    await fetch('?/update_creator', {
      method: 'POST',
      body: formData
    });
  };

  const updateAgent = async (
    index: number,
    {
      name,
      address,
      active
    }: {
      name?: string;
      address?: string;
      active?: boolean;
    }
  ) => {
    const agent = agents[index];
    let formData = new FormData();
    formData.append('name', name || agent.user.name);
    formData.append('address', address || agent.user.address || '');
    formData.append('userId', agent.user._id.toString());
    formData.append(
      'active',
      active ? active.toString() : agent.user.active.toString()
    );

    await fetch('?/update_agent', {
      method: 'POST',
      body: formData
    });
  };

  const updateCreatorName = (event: FocusEvent) => {
    const name = (event.target as HTMLTableCellElement).innerText;
    if (name === creators[activeCreatorRow].user.name) return;
    creators[activeCreatorRow].user.name = name;
    updateCreator(activeCreatorRow, { name });
  };

  const updateCommission = (event: FocusEvent) => {
    const commission = Number((event.target as HTMLTableCellElement).innerText);
    if (commission === creators[activeCreatorRow].commissionRate) return;
    creators[activeCreatorRow].commissionRate = commission;
    updateCreator(activeCreatorRow, { commission });
  };

  const updateCreatorActive = (event: Event) => {
    const active = (event.target as HTMLInputElement).checked;
    if (active === creators[activeCreatorRow].user.active) return;
    creators[activeCreatorRow].user.active = active;
    updateCreator(activeCreatorRow, {
      active
    });
  };

  const updateAgentActive = (event: Event) => {
    const active = (event.target as HTMLInputElement).checked;
    if (active === agents[activeAgentRow].user.active) return;
    agents[activeCreatorRow].user.active = active;
    updateAgent(activeAgentRow, {
      active
    });
  };

  const updateAgentName = (event: FocusEvent) => {
    const name = (event.target as HTMLTableCellElement).innerText;
    if (name === agents[activeAgentRow].user.name) return;
    agents[activeAgentRow].user.name = name;
    updateAgent(activeAgentRow, {
      name
    });
  };

  const updateAgentAddress = (event: FocusEvent) => {
    const address = (event.target as HTMLTableCellElement).innerText;
    if (address === agents[activeAgentRow].user.address) return;
    agents[activeAgentRow].user.address = address;
    updateAgent(activeAgentRow, {
      address
    });
  };

  const updateCreatorAgent = (event: Event) => {
    const agentId = new Types.ObjectId(
      (event.target as HTMLSelectElement).value
    );
    if (agentId === creators[activeCreatorRow].agent) return;
    creators[activeCreatorRow].agent = agentId;
    updateCreator(activeCreatorRow, { agentId });
  };

  const getAgentName = (agentId: Types.ObjectId) => {
    const agent = agents.find(
      (agent) => agent._id.toString() === agentId.toString()
    );
    return agent?.user.name;
  };

  const onSubmit = ({}) => {
    return async ({ result }: { result: ActionResult }) => {
      if (result?.type === 'success') {
        canAddAgent = false;
        canAddCreator = false;
        await invalidateAll();
        if (result.data!.agentCreated) {
          agentName =
            'Agent ' +
            uniqueNamesGenerator({
              dictionaries: [womensNames]
            });
          agentAddress = '';
          agents = $page.data.agents;
        }
        if (result.data!.creatorCreated) {
          creatorName =
            'Creator ' +
            uniqueNamesGenerator({
              dictionaries: [womensNames]
            });
          creators = $page.data.creators;
          newCreator = result.data!.creator;
          newPassword = result.data!.password;
          newCreatorModal.showModal();
        }
      } else if (result?.type === 'failure') {
        if (result.data!.badAgentName) {
          agentNameElement.focus();
        }
        if (result.data!.badAgentAddress) {
          agentAddressElement.focus();
        }
        if (result.data!.badCommission) {
          creatorCommissionElement.focus();
        }
        if (result.data!.badCreatorName) {
          creatorNameElement.focus();
        }
        if (result.data!.missingAgentId) {
          creatorAgentElement.focus();
        }
      }
    };
  };

  const decideDisputeModal: ModalSettings = {
    type: 'component',
    component: 'DecideDispute',
    meta: {
      ticket: disputedTickets[activeDisputeRow]
    },
    response: (decision: DisputeDecision) => {
      decideDispute(decision);
    }
  };

  const showDecideDispute = () => {
    modalStore.trigger(decideDisputeModal);
  };

  const changeSecretModal: ModalSettings = {
    type: 'confirm',
    // Data
    title: 'Change Creator URL',
    body: "Changing the Creator's Secret URL will disable the current URL and create a new one.",
    // TRUE if confirm pressed, FALSE if cancel pressed
    response: (r: boolean) => {
      if (r) {
        changeUserSecret();
      }
    }
  };
</script>

{#if operator}
  <div class="min-h-screen min-w-full">
    <main class="px-10 pt-2">
      <!-- Page header -->
      {#key operator}
        <div
          class="bg-base border-secondary mx-auto rounded-lg border-2 px-4 py-4 sm:px-6 lg:px-8"
        >
          <h2 class="flex items-center gap-2 text-2xl font-semibold">
            Operator Dashboard
          </h2>
          <hr class="my-2 !border-t-2" />
          <!-- Tabs -->
          <TabGroup>
            <Tab bind:group={tabSet} name="Agents" value={0}>
              <div class="flex items-center gap-1">
                <Icon icon="material-symbols-light:support-agent-rounded" />
                Agents
              </div>
            </Tab>
            <Tab bind:group={tabSet} name="Creators" value={1}>
              <div class="flex items-center gap-1">
                <Icon icon="mdi:dance-pole" />
                Creators
              </div></Tab
            >
            <Tab bind:group={tabSet} name="Disputes" value={2}>
              <div class="flex items-center gap-1">
                <Icon icon="healthicons:justice-outline" />
                Disputes
              </div></Tab
            >
            <svelte:fragment slot="panel">
              {#if tabSet === 0}
                <div class="overflow-x-auto">
                  {#key agents}
                    <div class="table-container">
                      <table class="table table-interactive">
                        <thead class="table-header">
                          <tr class="table-row">
                            <th
                              ><button
                                class="variant-filled btn-icon btn-icon-sm"
                                on:click={() => {
                                  canAddAgent = !canAddAgent;
                                }}
                              >
                                <Icon
                                  icon="mingcute:add-circle-line"
                                  class="text-xl"
                                /></button
                              >
                            </th>
                            <th>Name</th>
                            <th>Address</th>
                            <th>Active</th>
                            <th>Permissions</th>
                            {#if canImpersonateAgent}
                              <th>Action</th>
                            {/if}
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
                                    class="variant-filled btn btn-sm"
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
                            <tr on:click={() => (activeAgentRow = index)}>
                              <td>{index + 1}</td>
                              <td
                                contenteditable="true"
                                on:blur={updateAgentName}>{agent.user.name}</td
                              >
                              <td
                                contenteditable="true"
                                on:blur={updateAgentAddress}
                                >{agent.user.address}</td
                              >
                              <td>
                                <input
                                  class="checkbox"
                                  type="checkbox"
                                  checked={agent.user.active}
                                  on:change={updateAgentActive}
                                />
                              </td>
                              <td>
                                <div class="flex gap-2">
                                  {#each agent.user.permissions as permission}
                                    <div
                                      class="variant-filled-primary chip hover:variant-ringed"
                                    >
                                      {permission}
                                    </div>
                                  {/each}
                                </div>
                              </td>
                              {#if canImpersonateAgent}
                                <td>
                                  <button
                                    class="variant-outline-primary btn btn-sm text-primary-500"
                                    disabled={!canImpersonateAgent}
                                    on:click={() =>
                                      impersonate(agent.user._id.toString())}
                                  >
                                    Impersonate
                                  </button></td
                                >
                              {/if}
                            </tr>
                          {/each}
                        </tbody>
                        <!-- <tfoot>
                          <tr>
                            <th />
                            <th>Name</th>
                            <th>Address</th>
                            <th>Active</th>
                            <th>Permissions</th>

                            {#if canImpersonateAgent}
                              <th>Action</th>
                            {/if}
                          </tr>
                        </tfoot> -->
                      </table>
                    </div>
                  {/key}
                </div>
              {:else if tabSet === 1}
                <div class="overflow-x-auto">
                  {#key creators}
                    <div class="table-container">
                      <table class="table table-interactive">
                        <thead class="table-header">
                          <tr class="table-row">
                            <th
                              ><button
                                class="variant-filled btn-icon btn-icon-sm"
                                on:click={() => {
                                  canAddCreator = !canAddCreator;
                                }}
                              >
                                <Icon
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
                            {#if canImpersonateCreator}
                              <th>Impersonate</th>
                            {/if}
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
                                    class="variant-filled btn btn-sm"
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
                                  class="select"
                                  bind:value={selectedAgentId}
                                  bind:this={creatorAgentElement}
                                >
                                  <option disabled value="0" selected>
                                    Select Agent</option
                                  >
                                  {#each agents as agent}
                                    <option value={agent._id}
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
                            <tr on:click={() => (activeCreatorRow = index)}>
                              <td>{index + 1}</td>
                              <td
                                contenteditable="true"
                                on:blur={updateCreatorName}
                                >{creator.user.name}</td
                              >
                              <td>
                                {#if agentId}
                                  <select
                                    class="select p-0 text-sm"
                                    on:change={updateCreatorAgent}
                                  >
                                    <option value={agentId} selected
                                      >{agentName}</option
                                    >
                                    {#each agents as agent}
                                      {#if agent._id !== agentId}
                                        <option value={agent._id}
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
                                on:blur={updateCommission}
                                >{creator.commissionRate}</td
                              >
                              <td>
                                <input
                                  class="checkbox"
                                  type="checkbox"
                                  checked={creator.user.active}
                                  on:change={updateCreatorActive}
                                />
                              </td>
                              <td
                                >{#if creator.user.authType !== AuthType.SIGNING}
                                  <CopyText
                                    copyValue={urlJoin(
                                      $page.url.origin,
                                      config.PATH.creator,
                                      creator.user.secret || ''
                                    )}
                                    class="anchor mr-2">Secret Url</CopyText
                                  >
                                  <button
                                    class="text-secondary variant-outline-secondary btn btn-sm"
                                    on:click={() =>
                                      modalStore.trigger(changeSecretModal)}
                                  >
                                    Change
                                  </button>
                                {:else}
                                  N/A
                                {/if}
                              </td>

                              <td
                                >{#if creator.salesStats.totalTicketSalesAmounts}
                                  {#each Object.entries(creator.salesStats.totalTicketSalesAmounts) as [currency, amount]}
                                    {currencyFormatter(currency).format(amount)}
                                  {/each}
                                {:else}
                                  {currencyFormatter().format(0)}
                                {/if}
                              </td>
                              <td>
                                {#if creator.salesStats.totalRevenue}
                                  {#each Object.entries(creator.salesStats.totalRevenue) as [currency, amount]}
                                    {currencyFormatter(currency).format(amount)}
                                  {/each}
                                {:else}
                                  {currencyFormatter().format(0)}
                                {/if}
                              </td>
                              <td>
                                {#if creator.salesStats.totalRefunds}
                                  {#each Object.entries(creator.salesStats.totalRefunds) as [currency, amount]}
                                    {currencyFormatter(currency).format(amount)}
                                  {/each}
                                {:else}
                                  {currencyFormatter().format(0)}
                                {/if}
                              </td>
                              <td>{creator.feedbackStats.numberOfReviews}</td>
                              <td>
                                <Ratings
                                  bind:value={creator.feedbackStats
                                    .averageRating}
                                  max={5}
                                  justify="left"
                                >
                                  <svelte:fragment slot="empty"
                                    ><Icon
                                      icon="fluent:star-28-regular"
                                    /></svelte:fragment
                                  >
                                  <svelte:fragment slot="half"
                                    ><Icon
                                      icon="fluent:star-half-28-regular"
                                    /></svelte:fragment
                                  >
                                  <svelte:fragment slot="full"
                                    ><Icon
                                      icon="fluent:star-28-filled"
                                    /></svelte:fragment
                                  >
                                </Ratings></td
                              >
                              {#if canImpersonateCreator}
                                <td
                                  ><button
                                    class="variant-outline-primary btn btn-sm text-primary-500"
                                    disabled={!canImpersonateCreator}
                                    on:click={() =>
                                      impersonate(creator.user._id.toString())}
                                    >Impersonate
                                  </button></td
                                >
                              {/if}
                            </tr>
                          {/each}
                        </tbody>
                        <!-- <tfoot>
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
                            {#if canImpersonateCreator}
                              <th>Impersonate</th>
                            {/if}
                          </tr>
                        </tfoot> -->
                      </table>
                    </div>
                  {/key}
                </div>
              {:else}
                <div class="overflow-x-auto">
                  <div class="table-container">
                    <table class="table table-interactive">
                      <thead class="table-header">
                        <tr class="table-row">
                          <th />
                          <th>Creator</th>
                          <th>Amount</th>
                          <th>Show Start</th>
                          <th>Show End</th>
                          <th>Run Time</th>
                          <th>Reason</th>
                          <th>Explanation</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {#each disputedTickets as ticket, index}
                          {@const runtime = ticket.show.showState.runtime}
                          {#if ticket.show}
                            <tr on:click={() => (activeDisputeRow = index)}>
                              <td>{index + 1}</td>
                              <td>{ticket.show.creatorInfo.name}</td>
                              <td
                                >{currencyFormatter(
                                  ticket.price.currency
                                ).format(ticket.price.amount)}</td
                              >
                              <td
                                >{runtime &&
                                  spacetime(runtime.startDate || '').format(
                                    'nice'
                                  )}</td
                              >
                              <td
                                >{runtime &&
                                  spacetime(runtime.endDate).format('nice')}</td
                              >
                              <td
                                >{runtime &&
                                  spacetime(runtime.startDate).diff(
                                    runtime.endDate ?? spacetime.now()
                                  ).minutes}
                                min</td
                              >
                              <td>{ticket.ticketState.dispute?.reason}</td>
                              <td>{ticket.ticketState.dispute?.explanation}</td>
                              <td
                                ><button
                                  class="variant-filled-primary btn btn-sm m-0"
                                  on:click={showDecideDispute}>Decide</button
                                ></td
                              >
                            </tr>
                          {/if}
                        {/each}
                      </tbody>
                      <!-- <tfoot>
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
                      </tfoot> -->
                    </table>
                  </div>
                </div>
              {/if}
            </svelte:fragment>
          </TabGroup>
        </div>
      {/key}
    </main>
  </div>
{/if}
