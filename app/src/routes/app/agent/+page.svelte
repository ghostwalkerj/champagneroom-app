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
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';
  import { uniqueNamesGenerator } from 'unique-names-generator';
  import urlJoin from 'url-join';

  import { applyAction, deserialize, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';

  import type { AgentDocument } from '$lib/models/agent';
  import type { CreatorDocument } from '$lib/models/creator';
  import type { UserDocument } from '$lib/models/user';
  import type { WalletDocument } from '$lib/models/wallet';

  import config from '$lib/config';
  import type { CurrencyType } from '$lib/constants';
  import { AuthType, currencyFormatter } from '$lib/constants';
  import type { requestPayoutSchema } from '$lib/payout';
  import { PermissionType } from '$lib/permissions';
  import { womensNames } from '$lib/womensNames';

  import CopyText from '$components/CopyText.svelte';
  import WalletDetail from '$components/WalletDetail.svelte';
  import { AgentStore } from '$stores';

  import AgentDetail from './AgentDetail.svelte';
  import TopCreator from './TopCreator.svelte';
  import WeeklyBooking from './WeeklyBooking.svelte';

  import type { PageData } from './$types';

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
  let payoutForm = data.payoutForm as SuperValidated<
    Infer<typeof requestPayoutSchema>
  >;

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
  let agentUnSub: Unsubscriber;
  $: canImpersonate = false;
  let tabSet: number = 0;
  const modalStore = getModalStore();

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
    const isActive = (event.target as HTMLInputElement).checked;
    const index = activeRow;
    creators[index].user.active = isActive;
    updateCreator(creators[index]);
  };

  const changeUserSecret = async () => {
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

  const onSubmit = ({}) => {
    return async ({ result }: { result: ActionResult }) => {
      if (result?.type === 'success') {
        canAddCreator = false;
        await invalidateAll();
        creatorName = uniqueNamesGenerator({
          dictionaries: [womensNames]
        });

        const userSecretModal: ModalSettings = {
          type: 'component',
          component: 'UserSecret',
          meta: {
            user: result.data!.user,
            password: result.data!.password
          }
        };
        modalStore.trigger(userSecretModal);
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

{#if agent}
  <div class="min-h-screen min-w-full">
    <main class="px-10 pt-2">
      <!-- Page header -->
      {#key agent}
        <div
          class="bg-base border-secondary mx-auto rounded-lg border-2 px-4 py-4 sm:px-6 lg:px-8"
        >
          <h2 class="flex items-center gap-2 text-2xl font-semibold">
            Agent Dashboard
          </h2>
          <hr class="my-2 !border-t-2" />
          <!-- Tabs -->
          <TabGroup>
            <Tab bind:group={tabSet} name="Dashboard" value={0}>
              <div class="flex items-center gap-1">
                <Icon icon="carbon:dashboard" />
                Dashboard
              </div>
            </Tab>
            <Tab bind:group={tabSet} name="Creators" value={1}>
              <div class="flex items-center gap-1">
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
                                    class="variant-outline-secondary btn btn-sm text-secondary-500"
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
                                </Ratings>
                              </td>
                              {#if canImpersonate}
                                <td>
                                  <button
                                    class="variant-outline-primary btn btn-sm text-primary-500"
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
                        <!-- <tfoot>
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
                        </tfoot> -->
                      </table>
                    </div>
                  {/key}
                </div>
              {:else if tabSet === 0}
                <div
                  class="min-w-full flex-col lg:grid lg:min-w-min lg:grid-cols-5"
                >
                  <!-- 1st column -->
                  <div class="m-4 flex-1 space-y-3">
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
                  <div class="m-4 space-y-3 md:col-span-2 md:ml-0">
                    <TopCreator {creators} {showData} />
                  </div>

                  <!--Next Column-->
                  <div class="m-4 space-y-3 md:col-span-2 md:ml-0">
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
