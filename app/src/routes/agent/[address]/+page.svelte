<script lang="ts">
  import { nanoid } from 'nanoid';
  import { uniqueNamesGenerator } from 'unique-names-generator';

  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_DEFAULT_COMMISSION } from '$env/static/public';

  import type { AgentDocumentType } from '$lib/models/agent';
  import type { TalentDocumentType } from '$lib/models/talent';

  import { womensNames } from '$lib/util/womensNames';

  import { nameStore } from '$stores';

  import AgentWallet from './AgentWallet.svelte';
  import TalentForm from './TalentForm.svelte';

  import type { ActionData, PageData } from './$types';

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
  let talentAddress = nanoid(30);

  nameStore.set(agent.user.name);

  const onSubmit = ({}) => {
    return async ({ result }) => {
      if (result?.type === 'success') {
        canAddTalent = false;
        await invalidateAll();
        talentName = uniqueNamesGenerator({
          dictionaries: [womensNames]
        });
        talentAddress = nanoid(30);
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
                <table class="table table-pin-rows table-pin-cols">
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
                      <th>Key</th>
                      <th>Commission</th>
                      <th>Active</th>
                      <th>Impersonate</th>
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
                              name="address"
                              value={talentAddress}
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
                          bind:this={talentAddressElement}
                          bind:innerText={talentAddress}
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
                            console.log(event.target?.textContent);
                          }}>{talent.user.name}</td
                        >
                        <td contenteditable="true">{talent.user.address}</td>
                        <td contenteditable="true">{talent.agentCommission}</td>

                        <td>
                          <select
                            class="select select-bordered select-xs max-w-xs"
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
            class:invisible={activeTab !== 'Dashboard'}
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
