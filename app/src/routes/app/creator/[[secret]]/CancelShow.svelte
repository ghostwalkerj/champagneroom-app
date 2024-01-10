<script lang="ts">
  import { applyAction, enhance } from '$app/forms';

  export let isLoading = false;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  export let onShowCancelled: () => void;

  const onSubmit = ({}) => {
    isLoading = true;
    return async ({ result }) => {
      switch (true) {
        case result.data.showCancelled: {
          onShowCancelled();
          break;
        }
      }
      await applyAction(result);
      isLoading = false;
    };
  };
</script>

<form method="post" action="?/cancel_show" use:enhance={onSubmit}
  class="bg-custom rounded p-4 flex gap-4 justify-between"
>

<div><h2 class="text-xl font-semibold">Cancel Your Show</h2>
  <p class="text">
    If you cancel this show any tickets sold will be refunded.
  </p></div>
      
          <button
            class="btn variant-soft-error"
            type="submit"
            disabled={isLoading}>Cancel Show</button
          >

</form>


