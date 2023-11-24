<script lang="ts">
  import type { ObjectId } from 'mongodb';

  import { applyAction, enhance } from '$app/forms';

  export let canStartShow: boolean;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  export let currentShow: { _id: ObjectId } | undefined;
  export let isLoading = false;

  export let onGoToShow: () => void;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  export let onShowEnded: () => void;

  const onSubmit = ({}) => {
    isLoading = true;
    return async ({ result }) => {
      if (result.data.success) {
        onShowEnded();
      }
      await applyAction(result);
      isLoading = false;
    };
  };
</script>

<input type="checkbox" id="restart-show-modal" class="modal-toggle" />
<div class="modal modal-open">
  <div class="modal-box">
    <h3 class="font-bold text-lg">You have Stopped the Show</h3>
    <p class="py-4">
      Are you sure you want to end the show? You will not be able to restart
      later. Ticket holders will be able to give feedback once the show is
      ended.
    </p>
    <div class="modal-action">
      <button
        class="btn"
        on:click={() => {
          isLoading = true;
          onGoToShow();
        }}
        disabled={!canStartShow || isLoading}>Restart Show</button
      >
      <form method="post" action="?/end_show" use:enhance={onSubmit}>
        <button class="btn" disabled={isLoading}>End Show</button>
      </form>
    </div>
  </div>
</div>
