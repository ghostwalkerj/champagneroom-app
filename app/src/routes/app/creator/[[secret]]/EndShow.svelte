<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import type { ActionResult } from '@sveltejs/kit';

  export let canStartShow: boolean;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  export let isLoading = false;

  export let onGoToShow: () => void;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  export let onShowEnded: () => void;

  const onSubmit = ({}) => {
    isLoading = true;
    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'success') {
        onShowEnded();
      }
      await applyAction(result);
      isLoading = false;
    };
  };
</script>

<!--
  THIS COMPONENT IS NO LONGER IN USE
-->

<input type="checkbox" id="restart-show-modal" class="daisy-modal-toggle" />
<div class="daisy-modal daisy-modal-open hidden">
  <div class="daisy-modal-box">
    <h3 class="font-bold text-lg">You have Stopped the Show</h3>
    <p class="py-4">
      Are you sure you want to end the show? You will not be able to restart
      later. Ticket holders will be able to give feedback once the show is
      ended.
    </p>
    <div class="daisy-modal-action">
      <button
        class="daisy-btn"
        on:click={() => {
          isLoading = true;
          onGoToShow();
        }}
        disabled={!canStartShow || isLoading}>Restart Show</button
      >
      <form
        method="post"
        id="endShow"
        action="?/end_show"
        use:enhance={onSubmit}
      >
        <button class="daisy-btn" disabled={isLoading}>End Show</button>
      </form>
    </div>
  </div>
</div>
