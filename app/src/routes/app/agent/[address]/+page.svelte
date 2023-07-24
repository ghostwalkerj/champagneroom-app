<script lang="ts">
  import StarRating from 'svelte-star-rating';
  import { uniqueNamesGenerator } from 'unique-names-generator';
  import urlJoin from 'url-join';

  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    PUBLIC_CREATOR_PATH,
    PUBLIC_DEFAULT_COMMISSION
  } from '$env/static/public';

  import type { AgentDocumentType } from '$lib/models/agent';
  import type { CreatorDocumentType } from '$lib/models/creator';

  import { currencyFormatter } from '$lib/constants';
  import { womensNames } from '$lib/util/womensNames';

  import { nameStore } from '$stores';

  import AgentWallet from './AgentWallet.svelte';
  import TopCreator from './TopCreator.svelte';

  import type { PageData } from './$types';

  export let data: PageData;
  const agent = data.agent as AgentDocumentType;
  let creators = data.creators as CreatorDocumentType[];

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
  let isChangeUrl = false;

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
    formData.append('name', name || creator.user.name);
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

  const changeUrl = async () => {
    const index = activeRow;
    const creatorId = creators[index]._id.toString();
    let formData = new FormData();
    formData.append('creatorId', creatorId);
    const response = await fetch('?/change_creator_key', {
      method: 'POST',
      body: formData
    });
    const resp = await response.json();
    const respData = JSON.parse(resp.data);
    const addressIndex = respData[0]['address'];
    if (addressIndex) {
      creators[index].user.address = respData[addressIndex];
    }
    isChangeUrl = false;
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

{#if agent}
  <!-- Modal for Restarting or Ending Show -->
  {#if isChangeUrl}
    <input type="checkbox" id="changeUrl-show-modal" class="modal-toggle" />
    <div class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Change Creator URL</h3>
        <p class="py-4">
          Changing the Creator's Unique URL will disable the current URL and
          create a new one.
        </p>
        <div class="modal-action">
          <button class="btn" on:click={() => (isChangeUrl = false)}
            >Cancel</button
          >
          <button class="btn" on:click={changeUrl}>Change</button>
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
          <div class="font-semibold text-secondary text-lg leading-6">
            Agent Dashboard
          </div>
          <div class="divider" />
          <!-- Tabs -->
          <div class="tabs tabs-boxed">
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
                class="mt-4 bg-neutral w-full rounded-lg z-0 overflow-hidden border-2 border-secondary"
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
                          <th>URL</th>
                          <th>Change URL</th>
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
                              ><a
                                href={urlJoin(
                                  PUBLIC_CREATOR_PATH,
                                  creator.user.address
                                )}
                                target="_blank"
                                class="link link-primary">Creator Url</a
                              >
                            </td>
                            <td>
                              <button
                                class="btn btn-xs btn-outline btn-primary"
                                on:click={() => (isChangeUrl = true)}
                              >
                                Change
                              </button>
                            </td>

                            <td
                              >{currencyFormatter.format(
                                creator.salesStats.totalSales
                              )}</td
                            >
                            <td
                              >{currencyFormatter.format(
                                creator.salesStats.totalRevenue
                              )}</td
                            >
                            <td
                              >{currencyFormatter.format(
                                creator.salesStats.totalRefunded
                              )}</td
                            >
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
                          <th>URL</th>
                          <th>Change URL</th>
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
