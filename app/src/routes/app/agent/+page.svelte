<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';
  import StarRating from 'svelte-star-rating';
  import { uniqueNamesGenerator } from 'unique-names-generator';
  import urlJoin from 'url-join';

  import { deserialize, enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    PUBLIC_CREATOR_PATH,
    PUBLIC_DEFAULT_COMMISSION
  } from '$env/static/public';

  import type { AgentDocumentType } from '$lib/models/agent';
  import type { CreatorDocumentType } from '$lib/models/creator';
  import { AuthType } from '$lib/models/user';

  import { currencyFormatter } from '$lib/constants';
  import { womensNames } from '$lib/womensNames';

  import { nameStore } from '$stores';

  import AgentWallet from './AgentWallet.svelte';
  import TopCreator from './TopCreator.svelte';

  import type { PageData } from './$types';

  export let data: PageData;
  const agent = data.agent as AgentDocumentType;
  let creators = data.creators as CreatorDocumentType[];

  let newCreatorModal: HTMLDialogElement;
  let newCreator: CreatorDocumentType | undefined;
  let newPassword: string | undefined;
  let activeRow = 0;
  let activeTab = 'Creators' as 'Creators' | 'Dashboard';
  $: canAddCreator = false;
  let creatorNameElement: HTMLTableCellElement;
  let creatorAddressElement: HTMLTableCellElement;
  let creatorCommissionElement: HTMLTableCellElement;
  let commission = PUBLIC_DEFAULT_COMMISSION;
  let creatorName = uniqueNamesGenerator({
    dictionaries: [womensNames]
  });
  let isChangeCreatorSecret = false;

  nameStore.set(agent.user.name);

  const updateCreator = async (
    index: number,
    {
      name,
      commission,
      active
    }: { name?: string; commission?: number; active?: boolean }
  ) => {
    const creator = creators[index];
    let formData = new FormData();
    formData.append('creatorId', creator._id.toString());
    formData.append('name', name || '');
    formData.append(
      'commission',
      commission ? commission.toString() : creator.agentCommission.toString()
    );
    formData.append(
      'active',
      active ? active.toString() : creator.user.active.toString()
    );

    await fetch('?/update_creator', {
      method: 'POST',
      body: formData
    });
  };

  const updateName = (name: string) => {
    creators[activeRow].user.name = name;
    updateCreator(activeRow, { name });
  };

  const updateCommission = (commission: number) => {
    creators[activeRow].agentCommission = commission;
    updateCreator(activeRow, { commission });
  };

  const updateActive = (active: string) => {
    creators[activeRow].user.active = active == 'true' ? true : false;
    updateCreator(activeRow, { active: creators[activeRow].user.active });
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
    }

    isChangeCreatorSecret = false;
  };

  const onSubmit = ({}) => {
    return async ({ result }) => {
      if (result?.type === 'success') {
        canAddCreator = false;
        await invalidateAll();
        creatorName = uniqueNamesGenerator({
          dictionaries: [womensNames]
        });

        commission = PUBLIC_DEFAULT_COMMISSION;
        creators = $page.data.creators;
        newCreator = result.data.creator;
        newPassword = result.data.password;
        newCreatorModal.showModal();
      } else {
        if (result.data.badName) {
          creatorNameElement.focus();
        }
        if (result.data.badAddress) {
          creatorAddressElement.focus();
        }
        if (result.data.badCommission) {
          creatorCommissionElement.focus();
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
            href={urlJoin(PUBLIC_CREATOR_PATH, newCreator.user.secret)}
            target="_blank"
            class="link link-primary"
          >
            {urlJoin(
              $page.url.href,
              PUBLIC_CREATOR_PATH,
              newCreator.user.secret
            )}</a
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

{#if agent}
  <!-- Modal for Changing Creator URL -->
  {#if isChangeCreatorSecret}
    <input type="checkbox" id="changeUrl-show-modal" class="modal-toggle" />
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Change Creator URL</h3>
        <p class="py-4">
          Changing the Creator's Secret URL will disable the current URL and
          create a new one.
        </p>
        <div class="modal-action">
          <button class="btn" on:click={() => (isChangeCreatorSecret = false)}
            >Cancel</button
          >
          <button class="btn" on:click={changeCreatorSecret}>Change</button>
        </div>
      </div>
    </div>
  {/if}

  <div class="min-h-full">
    <main class="px-10 pt-2">
      <!-- Page header -->
      {#key agent}
        <div
          class="bg-base border-2 border-secondary rounded-lg mx-auto py-4 px-4 sm:px-6 lg:px-8"
        >
          <div class="font-semibold text-primary text-lg leading-6">
            Agent Dashboard
          </div>
          <div class="divider" />
          <!-- Tabs -->
          <div class="tabs tabs-boxed w-fit">
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
              class:tab-active={activeTab == 'Dashboard'}
              on:click={() => {
                activeTab = 'Dashboard';
              }}>Dashboard</a
            >
          </div>
        </div>

        <!-- Tables -->
        <div class="h-screen">
          <div class="relative">
            {#if activeTab === 'Creators'}
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
                          <th>Comm %</th>
                          <th>Active</th>
                          <th>Secret</th>
                          <th>Sales</th>
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
                          <tr
                            class:bg-base-300={activeRow === index}
                            on:click={() => (activeRow = index)}
                          >
                            <td>{index + 1}</td>
                            <td
                              contenteditable="true"
                              on:blur={(event) => {
                                updateName(event.target?.textContent);
                              }}>{creator.user.name}</td
                            >
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
                                  updateActive(event.target?.value);
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
                                    PUBLIC_CREATOR_PATH,
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
                <div
                  class="flex-col min-w-full md:min-w-min md:grid md:grid-cols-3"
                >
                  <!-- 1st column -->
                  <div
                    class="flex-1 m-4 space-y-3 md:col-start-1 md:col-span-3"
                  >
                    <!-- Status -->

                    <TopCreator {creators} />
                  </div>

                  <!--Next Column-->
                  <div
                    class="space-y-3 md:col-start-4 md:col-span-1 m-4 md:ml-0"
                  >
                    <!-- Wallet -->
                    <div class="h-full">
                      <AgentWallet />
                    </div>
                  </div>
                </div>
              </div>
            {/if}
          </div>
        </div>
      {/key}
    </main>
  </div>
{/if}
