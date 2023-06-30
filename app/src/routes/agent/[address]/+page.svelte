<script lang="ts">
  import StarRating from 'svelte-star-rating';
  import { uniqueNamesGenerator } from 'unique-names-generator';
  import urlJoin from 'url-join';

  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    PUBLIC_DEFAULT_COMMISSION,
    PUBLIC_TALENT_PATH
  } from '$env/static/public';

  import type { AgentDocumentType } from '$lib/models/agent';
  import type { TalentDocumentType } from '$lib/models/talent';

  import { currencyFormatter } from '$lib/constants';
  import { womensNames } from '$lib/util/womensNames';

  import { nameStore } from '$stores';

  import AgentWallet from './AgentWallet.svelte';
  import TopTalent from './TopTalent.svelte';

  import type { PageData } from './$types';

  export let data: PageData;
  const agent = data.agent as AgentDocumentType;
  let talents = data.talents as TalentDocumentType[];

  let activeRow = 0;
  let activeTab = 'Talents' as 'Talents' | 'Dashboard';
  $: canAddTalent = false;
  let talentNameElement: HTMLTableCellElement;
  let talentAddressElement: HTMLTableCellElement;
  let talentCommissionElement: HTMLTableCellElement;
  let commission = PUBLIC_DEFAULT_COMMISSION;
  let talentName = uniqueNamesGenerator({
    dictionaries: [womensNames]
  });
  let isChangeUrl = false;

  nameStore.set(agent.user.name);

  const updateTalent = async (
    index: number,
    {
      name,
      commission,
      active
    }: { name?: string; commission?: number; active?: boolean }
  ) => {
    const talent = talents[index];
    let formData = new FormData();
    formData.append('talentId', talent._id.toString());
    formData.append('name', name || talent.user.name);
    formData.append(
      'commission',
      commission ? commission.toString() : talent.agentCommission.toString()
    );
    formData.append(
      'active',
      active ? active.toString() : talent.user.active.toString()
    );

    await fetch('?/update_talent', {
      method: 'POST',
      body: formData
    });
  };

  const updateName = (name: string) => {
    talents[activeRow].user.name = name;
    updateTalent(activeRow, { name });
  };

  const updateCommission = (commission: number) => {
    talents[activeRow].agentCommission = commission;
    updateTalent(activeRow, { commission });
  };

  const updateActive = (active: string) => {
    talents[activeRow].user.active = active == 'true' ? true : false;
    updateTalent(activeRow, { active: talents[activeRow].user.active });
  };

  const changeUrl = async () => {
    const index = activeRow;
    const talentId = talents[index]._id.toString();
    let formData = new FormData();
    formData.append('talentId', talentId);
    const response = await fetch('?/change_talent_key', {
      method: 'POST',
      body: formData
    });
    const resp = await response.json();
    const respData = JSON.parse(resp.data);
    const addressIndex = respData[0]['address'];
    if (addressIndex) {
      talents[index].user.address = respData[addressIndex];
    }
    isChangeUrl = false;
  };

  const onSubmit = ({}) => {
    return async ({ result }) => {
      if (result?.type === 'success') {
        canAddTalent = false;
        await invalidateAll();
        talentName = uniqueNamesGenerator({
          dictionaries: [womensNames]
        });

        commission = PUBLIC_DEFAULT_COMMISSION;
        talents = $page.data.talents;
      } else {
        if (result.data.badName) {
          talentNameElement.focus();
        }
        if (result.data.badAddress) {
          talentAddressElement.focus();
        }
        if (result.data.badCommission) {
          talentCommissionElement.focus();
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
        <h3 class="font-bold text-lg">Change Talent URL</h3>
        <p class="py-4">
          Changing the Talent's Unique URL will disable the current URL and
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
    <main class="p-10">
      <!-- Page header -->
      {#key agent}
        <div class="bg-neutral rounded-lg mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div class="font-semibold text-primary text-md leading-6">
            Agent Dashboard
          </div>
          <div class="divider" />
          <!-- Tabs -->
          <div class="tabs tabs-boxed">
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a
              class="tab"
              class:tab-active={activeTab === 'Talents'}
              on:click={() => {
                activeTab = 'Talents';
              }}>Talents</a
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
        <div class="relative">
          <div
            class:invisible={activeTab !== 'Talents'}
            class="absolute top-4 left-0 bg-neutral w-full rounded-lg"
          >
            <div class="overflow-x-auto reo">
              {#key talents}
                <table class="table table-pin-rows">
                  <thead>
                    <tr>
                      <th
                        ><button
                          class="btn btn-circle btn-xs"
                          on:click={() => {
                            canAddTalent = !canAddTalent;
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
                    {#if canAddTalent}
                      <tr>
                        <td>
                          <form
                            method="post"
                            action="?/create_talent"
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
                              value={talentName}
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
                          bind:this={talentNameElement}
                          bind:innerText={talentName}
                        />

                        <td
                          contenteditable="true"
                          bind:this={talentCommissionElement}
                          bind:innerText={commission}
                        />
                        <td>True</td>
                        <td />
                      </tr>
                    {/if}
                    {#each talents as talent, index}
                      <tr
                        class:bg-base-300={activeRow === index}
                        on:click={() => (activeRow = index)}
                      >
                        <td>{index + 1}</td>
                        <td
                          contenteditable="true"
                          on:blur={(event) => {
                            updateName(event.target?.textContent);
                          }}>{talent.user.name}</td
                        >
                        <td
                          contenteditable="true"
                          on:blur={(event) => {
                            updateCommission(event.target?.textContent);
                          }}>{talent.agentCommission}</td
                        >
                        <td>
                          <select
                            class="select select-bordered select-xs max-w-xs"
                            on:change={(event) => {
                              updateActive(event.target?.value);
                            }}
                          >
                            {#if talent.user.active}
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
                              PUBLIC_TALENT_PATH,
                              talent.user.address
                            )}
                            class="link link-primary">Talent Url</a
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
                            talent.salesStats.totalSales
                          )}</td
                        >
                        <td
                          >{currencyFormatter.format(
                            talent.salesStats.totalRevenue
                          )}</td
                        >
                        <td
                          >{currencyFormatter.format(
                            talent.salesStats.totalRefunded
                          )}</td
                        >
                        <td>{talent.feedbackStats.numberOfReviews}</td>
                        <td
                          class="tooltip"
                          data-tip={talent.feedbackStats.averageRating.toFixed(
                            2
                          )}
                        >
                          <StarRating
                            rating={talent.feedbackStats.averageRating}
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
          <div
            class:invisible={activeTab !== 'Dashboard'}
            class="absolute top-4 left-0 bg-neutral w-full rounded-lg"
          >
            <div
              class="p-4 flex-col gap-3 min-w-full md:min-w-min md:grid md:grid-cols-3"
            >
              <!-- 1st column -->
              <div class="flex-1 space-y-3 md:col-start-1 md:col-span-3">
                <!-- Status -->
                <div class="md:col-start-3 md:col-span-1">
                  <div class="bg-primary text-primary-content card">
                    <div class="text-center card-body items-center">
                      <TopTalent {talents} />
                    </div>
                  </div>
                </div>
              </div>

              <!--Next Column-->
              <div class="space-y-3 md:col-start-4 md:col-span-1">
                <!-- Wallet -->
                <div class="h-full">
                  <AgentWallet />
                </div>
              </div>
            </div>
          </div>
        </div>
      {/key}
    </main>
  </div>
{/if}
