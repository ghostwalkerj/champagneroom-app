<script lang="ts">
  import { applyAction, enhance } from '$app/forms';

  import { DisputeReason } from '$lib/constants';

  import type { ActionData } from './$types';

  export let form: ActionData;
  export let isLoading = false;

  const reasons = Object.values(DisputeReason);

  const onSubmit = () => {
    isLoading = true;
    return async ({ result }) => {
      if (result.type === 'failure') {
        isLoading = false;
      }
      await applyAction(result);
      isLoading = false;
    };
  };
</script>

<!-- Checkbox to toggle modal -->
<input type="checkbox" id="initiate-dispute" class="daisy-modal-toggle" />

<!-- Modal -->
<div class="daisy-modal">
  <div class="daisy-modal-box">
    <label
      for="initiate-dispute"
      class="daisy-btn daisy-btn-sm daisy-btn-circle absolute right-2 top-2"
      >✕</label
    >
    <h3 class="text-lg lg:text-xl font-bold text-center">Initiate Dispute</h3>

    <!-- Form -->
    <form
      method="post"
      action="?/initiate_dispute"
      use:enhance={onSubmit}
      class="space-y-4"
    >
      <!-- Reason for Dispute Dropdown -->
      <div class="daisy-form-control">
        <label for="reason" class="daisy-label">
          <span class="daisy-label-text">Reason</span>
        </label>
        <select
          class="daisy-select daisy-select-bordered daisy-select-primary w-full"
          name="reason"
        >
          <option disabled selected>Reason for the Dispute</option>
          {#each reasons as reason}
            <option>{reason}</option>
          {/each}
        </select>
      </div>
      {#if form?.missingReason}<div
          class="shadow-lg daisy-alert daisy-alert-error"
        >
          Select a Reason
        </div>{/if}

      <!-- Explanation Textarea -->
      <div class="daisy-form-control">
        <label for="explanation" class="daisy-label">
          <span class="daisy-label-text">Explanation</span>
        </label>
        <textarea
          name="explanation"
          class="daisy-textarea daisy-textarea-bordered daisy-textarea-primary h-24"
        />
      </div>

      <!-- Submit Button -->
      <div class="text-center">
        <button type="submit" class="daisy-btn daisy-btn-primary">Submit</button
        >
      </div>
    </form>
  </div>
</div>

<!-- Button to Open Modal -->
<div class="p-4 w-full flex justify-center">
  <label for="initiate-dispute" class="daisy-btn daisy-btn-secondary"
    >Initiate Dispute</label
  >
</div>
