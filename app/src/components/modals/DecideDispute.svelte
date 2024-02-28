<script lang="ts">
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { SvelteComponent } from 'svelte';

  import { DisputeDecision } from '$lib/constants';
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
  <div class="rounded bg-surface-900 p-4">
    <h3 class="text-center text-lg font-bold lg:text-xl">Dispute Decision</h3>

    <div class="flex flex-col gap-3">
      <div class="form-control py-2">
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
          class="variant-filled-primary btn"
          type="button"
          on:click={onSubmit}
          disabled={decision === 'Decision'}
        >
          Submit
        </button>

        <button
          class="variant-soft-surface btn"
          type="button"
          on:click={parent.onClose()}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}
