<script lang="ts">
  import { applyAction, enhance } from '$app/forms';

  import type { ActionData } from './$types';

  export let form: ActionData;
  export let isLoading = false;

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

<input type="checkbox" id="leave-feedback" class="daisy-modal-toggle" />
<div class="daisy-modal">
  <div class="daisy-modal-box relative lg:max-w-2xl lg:mx-auto">
    <label
      for="leave-feedback"
      class="daisy-btn daisy-btn-sm daisy-btn-circle absolute right-2 top-2"
      >✕</label
    >
    <h3 class="text-lg lg:text-xl font-bold text-center">Leave Feedback</h3>
    <form method="post" action="?/leave_feedback" use:enhance={onSubmit}>
      <div class="py-2 form-control">
        <label for="rating" class="label">
          <span class="label-text">Rating</span>
        </label>
        <div class="rating rating-lg">
          <input
            type="radio"
            name="rating"
            class="rating-hidden"
            value="0"
            checked
          />
          <input
            type="radio"
            name="rating"
            value="1"
            class="mask mask-star-2 bg-primary"
          />
          <input
            type="radio"
            name="rating"
            value="2"
            class="mask mask-star-2 bg-primary"
          />
          <input
            type="radio"
            name="rating"
            value="3"
            class="mask mask-star-2 bg-primary"
          />
          <input
            type="radio"
            name="rating"
            value="4"
            class="mask mask-star-2 bg-primary"
          />
          <input
            type="radio"
            name="rating"
            value="5"
            class="mask mask-star-2 bg-primary"
          />
        </div>
        {#if form?.missingRating}
          <div class="shadow-lg daisy-alert daisy-alert-error">
            Rating is Required
          </div>
        {/if}
      </div>
      <div class="w-full py-2 form-control">
        <label for="review" class="label">
          <span class="label-text">Review</span></label
        >
        <div class="rounded-md shadow-sm mt-1 relative">
          <textarea
            name="review"
            class="textarea textarea-lg textarea-primary w-full"
            value={form?.review ?? ''}
          />
        </div>
      </div>

      <div class="py-4 text-center">
        {#if isLoading}
          <button
            class="daisy-btn daisy-btn-secondary loading"
            type="submit"
            disabled={true}>Submitting</button
          >
        {:else}
          <button
            class="daisy-btn daisy-btn-secondary"
            type="submit"
            disabled={isLoading}>Submit</button
          >
        {/if}
      </div>
    </form>
  </div>
</div>
<div class="p-4 w-full flex justify-center">
  <label for="leave-feedback" class="daisy-btn daisy-btn-secondary"
    >Leave Feedback</label
  >
</div>
