<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';

  import { applyAction, enhance } from '$app/forms';

  import type { ShowDocument } from '$lib/models/show';

  import type { ShowPermissionsType } from './+page.server';

  export let isLoading = false;
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  export let onShowCancelled: (
    show: ShowDocument,
    showPermissions: ShowPermissionsType
  ) => void;

  const onSubmit = ({}) => {
    isLoading = true;
    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'success') {
        onShowCancelled(result.data!.show, result.data!.showPermissions);
      }
      await applyAction(result);
      isLoading = false;
    };
  };
</script>

<form
  method="post"
  action="?/cancel_show"
  use:enhance={onSubmit}
  class="bg-custom flex justify-between gap-4 rounded p-4"
>
  <div>
    <h2 class="text-xl font-semibold">Cancel Your Show</h2>
    <p class="text">
      If you cancel this show any tickets sold will be refunded.
    </p>
  </div>

  <button class="variant-soft-error btn" type="submit" disabled={isLoading}
    >Cancel Show</button
  >
</form>
