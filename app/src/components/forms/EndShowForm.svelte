<script lang="ts">
import { getModalStore } from '@skeletonlabs/skeleton';
import type { SvelteComponent } from 'svelte';
import { applyAction, enhance } from '$app/forms';

const modalStore = getModalStore();
export let parent: SvelteComponent;

let meta = $modalStore[0].meta;

let canStartShow = meta.canStartShow;
let isLoading = meta.isLoading;

const onSubmit = ({}) => {
    isLoading = true;
    return async ({ result }) => {
      if (result.data.success) {

            $modalStore[0].response!(true);

      }
      await applyAction(result);
      isLoading = false;
    };
  };


</script>

{#if $modalStore[0]}
<div class="w-modal bg-surface-900 p-4 rounded">

    <h3 class="font-bold text-xl">You have stopped the show</h3>

    <p class="py-4">
        Are you sure you want to end the show? You will not be able to restart later. Ticket holders will be able to give feedback once the show is ended.
    </p>


    <form method="post" action="?/end_show" class="text-right" use:enhance={onSubmit}>
        <button class="btn variant-soft-surface" type="button"
        on:click={() => {
            isLoading = true;

            // @ts-ignore
            $modalStore[0].response(false);

          }}
         disabled={!canStartShow || isLoading}>Restart Show</button>
        <button class="btn variant-soft-primary" disabled={isLoading}>End Show</button>
    </form>
</div>
{/if}

