a<script lang="ts">
  import { applyAction, enhance } from '$app/forms';

  export let isLoading = false;
  let isShowCancelLoading = false;

  const onSubmit = (form: HTMLFormElement) => {
    if (form.name === 'cancelTicket') {
      isShowCancelLoading = true;
    }
    isLoading = true;
    return async ({ result }) => {
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
  <div class="flex justify-center w-full px-4 lg:px-8">
    <button class="daisy-btn daisy-btn-secondary loading" disabled={true}
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
    <div class="flex justify-center w-full px-4 lg:px-8">
      <button
        class="daisy-btn daisy-btn-secondary"
        type="submit"
        disabled={isLoading}
      >
        Cancel Ticket
      </button>
    </div>
  </form>
{/if}
