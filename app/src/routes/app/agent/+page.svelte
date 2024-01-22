<script lang="ts">
  import Icon from '@iconify/svelte';
  import type { ActionResult } from '@sveltejs/kit';
  import { Ratings } from '@skeletonlabs/skeleton';
  import { uniqueNamesGenerator } from 'unique-names-generator';
  import urlJoin from 'url-join';

  import { applyAction, deserialize, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  import config from '$lib/config';
  import { AuthType, currencyFormatter } from '$lib/constants';
  import { womensNames } from '$lib/womensNames';

  import TopCreator from './TopCreator.svelte';

  import WalletDetail from '$components/WalletDetail.svelte';
  import type { CurrencyType } from '$lib/constants';
  import type { AgentDocument } from '$lib/models/agent';
  import type { CreatorDocument } from '$lib/models/creator';
  import type { UserDocument } from '$lib/models/user';
  import type { WalletDocument } from '$lib/models/wallet';
  import { PermissionType } from '$lib/permissions';
  import { AgentStore } from '$stores';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import type { PageData } from './$types';
  import AgentDetail from './AgentDetail.svelte';
  import WeeklyBooking from './WeeklyBooking.svelte';
  import {
    TabGroup,
    Tab,
    type PopupSettings,
    popup
  } from '@skeletonlabs/skeleton';

  export let data: PageData;
  $: agent = data.agent as AgentDocument;
  $: creators = data.creators as CreatorDocument[];
  $: user = data.user as UserDocument;
  $: wallet = data.wallet as WalletDocument;
  $: showData = data.showData as {
    creatorId: string;
    currency: CurrencyType;
    amount: number;
  }[];
  $: weeklyData = data.weeklyData as {
    creatorId: string;
    dayOfWeek: number;
    bookings: number;
  }[];
  $: exchangeRate = +data.exchangeRate || 0;
  let payoutForm = data.payoutForm;

  let newCreatorModal: HTMLDialogElement;
  let newCreator: CreatorDocument | undefined;
  let newPassword: string | undefined;
  let activeRow = 0;
  $: canAddCreator = false;
  let creatorNameElement: HTMLTableCellElement;
  let creatorAddressElement: HTMLTableCellElement;
  let creatorCommissionElement: HTMLTableCellElement;
  $: commission =
    agent.defaultCommissionRate.toString() ||
    config.UI.defaultCommissionRate.toString();
  let creatorName = uniqueNamesGenerator({
    dictionaries: [womensNames]
  });
  let isChangeCreatorSecret = false;
  let agentUnSub: Unsubscriber;
  $: canImpersonate = false;
  let tabSet: number = 0;

  const popupHover: PopupSettings = {
    event: 'hover',
    target: 'popupHover',
    placement: 'top'
  };

  onMount(() => {
    canImpersonate = user.permissions.includes(
      PermissionType.IMPERSONATE_CREATOR
    );
    agentUnSub = AgentStore(agent).subscribe((_agent) => {
      if (_agent) {
        agent = _agent;
        commission = agent.defaultCommissionRate.toString();
      }
    });
  });

  onDestroy(() => {
    agentUnSub?.();
  });

  const updateCreator = async (creator: CreatorDocument) => {
    let formData = new FormData();
    formData.append('creatorId', creator._id.toString());
    formData.append('name', creator.user.name || '');
    formData.append('commission', creator.commissionRate.toString());
    formData.append('active', creator.user.active.toString());

    await fetch('?/update_creator', {
      method: 'POST',
      body: formData
    });
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

  const updateName = (event: FocusEvent) => {
    const name = (event.target as HTMLTableCellElement).innerText;
    if (name === creators[activeRow].user.name) return;
    const index = activeRow;
    creators[index].user.name = name;
    updateCreator(creators[index]);
  };

  const updateCommission = (event: FocusEvent) => {
    const commission = Number((event.target as HTMLTableCellElement).innerText);
    if (commission != creators[activeRow].commissionRate) {
      const index = activeRow;

      creators[index].commissionRate = commission;
      updateCreator(creators[index]);
    }
  };

  const updateActive = (event: Event) => {
    const active = (event.target as HTMLInputElement).checked;
    const index = activeRow;
    creators[index].user.active = active;
    updateCreator(creators[index]);
  };

  const changeCreatorSecret = async () => {
    const index = activeRow;
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
      newCreator = creators[index];
      newPassword = result.data.password;
      newCreatorModal.showModal();
    }

    isChangeCreatorSecret = false;
  };

  const onSubmit = ({}) => {
    return async ({ result }: { result: ActionResult }) => {
      if (result?.type === 'success') {
        canAddCreator = false;
        await invalidateAll();
        creatorName = uniqueNamesGenerator({
          dictionaries: [womensNames]
        });

        creators = $page.data.creators;
        newCreator = result.data!.creator;
        newPassword = result.data!.password;
        newCreatorModal.showModal();
      } else if (result?.type === 'failure') {
        if (result.data!.badName) {
          creatorNameElement.focus();
        }
        if (result.data!.badAddress) {
          creatorAddressElement.focus();
        }
        if (result.data!.badCommission) {
          creatorCommissionElement.focus();
        }
      }
    };
  };
</script>

<dialog id="new_creator_modal" class="daisy-modal" bind:this={newCreatorModal}>
  <div class="daisy-modal-box">
    {#if newCreator}
      <h3 class="font-bold text-lg text-center mb-6">New Creator</h3>
      <div class="text-center">
        {newCreator.user.name} has the following password:
        <div class="text-center font-bold text-lg">{newPassword}</div>
      </div>
      <div class="text-center mt-4">
        and Secret URL:
        <div class="text-center font-bold text-sm">
          <a
            href={urlJoin(
              $page.url.origin,
              config.PATH.creator,
              newCreator.user.secret || ''
            )}
            target="_blank"
            class="daisy-link daisy-link-primary"
          >
            {urlJoin(
              $page.url.origin,
              config.PATH.creator,
              newCreator.user.secret || ''
            )}</a
          >
        </div>
      </div>

      <div class="text-center m-auto pt-6">
        Share this information only with your Creator
      </div>
      <div class="daisy-modal-action">
        <form method="dialog">
          <!-- if there is a button in form, it will close the modal -->
          <button class="daisy-btn">Close</button>
        </form>
      </div>
    {/if}
  </div>
</dialog>

{#if agent}
  <!-- Modal for Changing Creator URL -->
  {#if isChangeCreatorSecret}
    <input
      type="checkbox"
      id="changeUrl-show-modal"
      class="daisy-modal-toggle"
    />
    <div class="daisy-modal daisy-modal-open">
      <div class="daisy-modal-box">
        <h3 class="font-bold text-lg">Change Creator URL</h3>
        <p class="py-4">
          Changing the Creator's Secret URL will disable the current URL and
          create a new one.
        </p>
        <div class="daisy-modal-action">
          <button
            class="daisy-btn"
            on:click={() => (isChangeCreatorSecret = false)}>Cancel</button
          >
          <button class="daisy-btn" on:click={changeCreatorSecret}
            >Change</button
          >
        </div>
      </div>
    </div>
  {/if}

  <div class="min-h-full min-w-full">
    <main class="px-10 pt-2">
      <!-- Page header -->
      {#key agent}
        <div
          class="bg-base border-2 border-secondary rounded-lg mx-auto py-4 px-4 sm:px-6 lg:px-8"
        >
          <h2 class="text-2xl font-semibold flex gap-2 items-center">
            Agent Dashboard
          </h2>
          <hr class="!border-t-2 my-2" />
          <!-- Tabs -->
          <TabGroup>
            <Tab bind:group={tabSet} name="Dashboard" value={0}>
              <div class="flex gap-1 items-center">
                <Icon icon="carbon:dashboard" />
                Dashboard
              </div>
            </Tab>
            <Tab bind:group={tabSet} name="Creators" value={1}>
              <div class="flex gap-1 items-center">
                <Icon icon="mdi:dance-pole" />
                Creators
              </div></Tab
            >
            <!-- Tab Panels --->
            <svelte:fragment slot="panel">
              {#if tabSet === 1}
                <div class="overflow-x-auto">
                  {#key creators}
                    <div class="table-container">
                      <table class="table table-interactive">
                        <thead class="table-header">
                          <tr class="table-row">
                            <th
                              ><button
                                class="btn variant-soft-secondary btn-sm neon-secondary"
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
                            <th>Comm %</th>
                            <th>Active</th>
                            <th>Secret</th>

                            <th>Sales</th>
                            <th>Revenue</th>
                            <th>Refunds</th>
                            <th>Reviews</th>
                            <th>Rating</th>
                            {#if canImpersonate}
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
                                    name="agentId"
                                    value={agent._id}
                                  />
                                  <input
                                    type="hidden"
                                    name="name"
                                    value={creatorName}
                                  />

                                  <input
                                    type="hidden"
                                    name="commission"
                                    value={commission}
                                  />
                                  <button
                                    class="daisy-btn daisy-btn-xs daisy-btn-ghost p-0"
                                    type="submit">Add</button
                                  >
                                </form>
                              </td>
                              <td
                                contenteditable="true"
                                bind:this={creatorNameElement}
                                bind:innerText={creatorName}
                              />

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
                            <tr on:click={() => (activeRow = index)}>
                              <td>{index + 1}</td>
                              <td contenteditable="true" on:blur={updateName}
                                >{creator.user.name}</td
                              >
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
                                  on:change={updateActive}
                                />
                              </td>

                              <td
                                >{#if creator.user.authType !== AuthType.SIGNING}<a
                                    href={urlJoin(
                                      config.PATH.creator,
                                      creator.user.secret || ''
                                    )}
                                    target="_blank"
                                    class="anchor">Secret Url</a
                                  >
                                  <button
                                    class="btn variant-outline-secondary btn-sm neon-secondary"
                                    on:click={() =>
                                      (isChangeCreatorSecret = true)}
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
                                  0
                                {/if}
                              </td>
                              <td>
                                {#if creator.salesStats.totalRevenue}
                                  {#each Object.entries(creator.salesStats.totalRevenue) as [currency, amount]}
                                    {currencyFormatter(currency).format(amount)}
                                  {/each}
                                {:else}
                                  0
                                {/if}
                              </td>
                              <td>
                                {#if creator.salesStats.totalRefunds}
                                  {#each Object.entries(creator.salesStats.totalRefunds) as [currency, amount]}
                                    {currencyFormatter(currency).format(amount)}
                                  {/each}
                                {:else}
                                  0
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
                                </Ratings>
                              </td>
                              {#if canImpersonate}
                                <td>
                                  <button
                                    class="btn variant-outline-primary btn-sm neon-primary"
                                    disabled={!canImpersonate}
                                    on:click={() =>
                                      impersonate(creator.user._id.toString())}
                                  >
                                    Impersonate
                                  </button>
                                </td>
                              {/if}
                            </tr>
                          {/each}
                        </tbody>
                        <tfoot>
                          <tr>
                            <th />
                            <th>Name</th>
                            <th>Comm %</th>
                            <th>Active</th>
                            <th>Secret</th>

                            <th>Sales</th>
                            <th>Revenue</th>
                            <th>Refunds</th>
                            <th>Reviews</th>
                            <th>Rating</th>
                            {#if canImpersonate}
                              <th>Impersonate</th>
                            {/if}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  {/key}
                </div>
              {:else if tabSet === 0}
                <div
                  class="flex-col min-w-full lg:min-w-min lg:grid lg:grid-cols-5"
                >
                  <!-- 1st column -->
                  <div class="flex-1 m-4 space-y-3">
                    <!-- Profile -->
                    <div class="min-w-fit">
                      <AgentDetail {agent} />
                    </div>
                    <!-- Wallet -->
                    <div class="min-w-fit">
                      <WalletDetail {wallet} {exchangeRate} {payoutForm} />
                    </div>
                  </div>

                  <!--Next Column-->
                  <div class="space-y-3 m-4 md:ml-0 md:col-span-2">
                    <TopCreator {creators} {showData} />
                  </div>

                  <!--Next Column-->
                  <div class="space-y-3 md:col-span-2 m-4 md:ml-0">
                    <WeeklyBooking {creators} {weeklyData} />
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
