<script lang="ts">
  import { applyAction, enhance } from '$app/forms';

  import type { ActionData, PageData } from './$types';

  export let data: PageData;
  export let form: ActionData;

  let isLoading = false;

  const onSubmit = () => {
    isLoading = true;
    return async ({ result }) => {
      if (result.type === 'failure') {
        isLoading = false;
      }
      await applyAction(result);
    };
  };
</script>

<div class="mt-4 h-full">
  <div class="flex flex-row justify-center h-full">
    <!-- Page header -->
    <div class="pb-4 text-center w-full max-w-3xl">
      <form method="post" action="?/create_invoice" use:enhance={onSubmit}>
        <div class="max-w-xs w-full py-2 form-control">
          <!-- svelte-ignore a11y-label-has-associated-control -->
          <label for="amount" class="label">
            <span class="label-text">Amount</span></label
          >
          <div class="rounded-md shadow-sm mt-1 relative">
            <input
              name="amount"
              type="text"
              class="max-w-xs w-full py-2 pl-6 input input-bordered input-primary"
              value={form?.amount ?? ''}
              minlength="1"
            />
            {#if form?.missingAmount}<div class="shadow-lg alert alert-error">
                Amount is required
              </div>{/if}
            {#if form?.invalidAmount}<div class="shadow-lg alert alert-error">
                Amount must be greater than 0
              </div>{/if}
          </div>
        </div>

        <div class="py-4 text-center">
          {#if isLoading}
            <button
              class="btn btn-secondary loading"
              type="submit"
              disabled={true}>Creating</button
            >
          {:else}
            <button class="btn btn-secondary" type="submit" disabled={isLoading}
              >Create</button
            >
          {/if}
        </div>
      </form>
    </div>
  </div>
</div>
