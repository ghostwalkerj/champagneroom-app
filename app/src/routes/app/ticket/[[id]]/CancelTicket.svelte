<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import type { ActionResult } from '@sveltejs/kit';

  export let isLoading = false;
  let isShowCancelLoading = false;

  const onSubmit = (form: HTMLFormElement) => {
    if (form.name === 'cancelTicket') {
      isShowCancelLoading = true;
    }
    isLoading = true;
    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'failure') {
        isLoading = false;
      }
      await applyAction(result);
      isLoading = false;
      isShowCancelLoading = false;
    };
  };
</script>

{#if isShowCancelLoading}
  <div class="flex w-full justify-center px-4 lg:px-8">
    <button class="loading variant-filled-secondary btn" disabled={true}
      >Cancelling</button
    >
  </div>
{:else}
  <form
    method="post"
    action="?/cancel_ticket"
    name="cancelTicket"
    use:enhance={({ formElement }) => onSubmit(formElement)}
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
{/if}
