<script lang="ts">
  import type { ActionResult } from '@sveltejs/kit';

  import { applyAction, enhance } from '$app/forms';

  import type { TicketDocument } from '$lib/models/ticket';

  import type { TicketPermissionsType } from '$lib/server/machinesUtil';

  export let isLoading = false;
  export let onTicketCancelled: (
    ticket: TicketDocument,
    ticketPermissions: TicketPermissionsType
  ) => void;
  const onSubmit = () => {
    isLoading = true;
    return async ({ result }: { result: ActionResult }) => {
      isLoading = false;
      switch (result.type) {
        case 'success': {
          onTicketCancelled(
            result.data!.ticket,
            result.data!.ticketPermissions
          );
          break;
        }
      }
      await applyAction(result);
    };
  };
</script>

<form
  method="post"
  action="?/cancel_ticket"
  name="cancelTicket"
  use:enhance={onSubmit}
>
  <div class="flex w-full justify-center px-4 lg:px-8">
    <button
      class="variant-filled-secondary btn"
      type="submit"
      disabled={isLoading}
    >
      Cancel Ticket
    </button>
  </div>
</form>
