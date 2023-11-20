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

<form method="post" action="?/cancel_show" use:enhance={onSubmit}>
  <div class="bg-primary text-primary-content card">
    <div class="text-center card-body items-center p-3">
      <div class="text-2xl card-title">Cancel Your Show</div>
      <div class="text xl">
        If you cancel this show any tickets sold will be refunded.
      </div>

      <div class="flex flex-col text-white p-2 justify-center items-center">
        <div class="">
          <button class="btn btn-secondary" type="submit" disabled={isLoading}
            >Cancel Show</button
          >
        </div>
      </div>
    </div>
  </div>
</form>
