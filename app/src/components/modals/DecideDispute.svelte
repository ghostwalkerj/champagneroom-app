<script lang="ts">
  import { DisputeDecision } from '$lib/constants';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { SvelteComponent } from 'svelte';
  export let parent: SvelteComponent;
  const modalStore = getModalStore();
  const decisions = Object.values(DisputeDecision);
  let decision = 'Decision';

  const onSubmit = () => {
    $modalStore[0].response!(decision);
    parent.onClose();
  };
</script>

{#if $modalStore[0]}
  <div class="bg-surface-900 p-4 rounded">
    <h3 class="text-lg lg:text-xl font-bold text-center">Dispute Decision</h3>

    <div class="flex gap-3 flex-col">
      <div class="py-2 form-control">
        <select
          class="select w-full max-w-xs"
          name="decision"
          bind:value={decision}
        >
          <option disabled selected>Decision</option>

          {#each decisions as decision}
            <option>{decision}</option>
          {/each}
        </select>
      </div>

      <div>
        <button
          class="btn variant-filled-primary"
          type="button"
          on:click={onSubmit}
          disabled={decision === 'Decision'}
        >
          Submit
        </button>

        <button
          class="btn variant-soft-surface"
          type="button"
          on:click={parent.onClose()}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}
