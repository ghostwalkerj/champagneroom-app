<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { SvelteComponent } from 'svelte';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms/client';

  import type { ticketDisputeSchema } from '$lib/models/common';

  import { DisputeReason } from '$lib/constants';

  const reasons = Object.values(DisputeReason);

  export let parent: SvelteComponent;
  const modalStore = getModalStore();

  let meta = $modalStore[0].meta;
  let action = meta.action;
  let ticketDisputeForm = $modalStore[0].meta.form as SuperValidated<
    typeof ticketDisputeSchema
  >;

  const { form, errors, constraints, enhance, delayed, message } = superForm(
    ticketDisputeForm,
    {
      validationMethod: 'auto',
      onError() {
        $message =
          'There was an error processing your request. Please try again later.';
      },
      onResult(event) {
        if (event.result.type === 'success') {
          parent.onClose();
        }
      }
    }
  );
</script>

{#if $modalStore[0]}
  <!-- Form -->
  <form method="post" {action} use:enhance class="space-y-4">
    <h3 class="text-center text-lg font-bold lg:text-xl">Initiate Dispute</h3>

    <!-- Reason for Dispute Dropdown -->
    <div class="label">Reason</div>
    <select
      class="select w-full max-w-xs"
      name="reason"
      bind:value={$form.reason}
      {...$constraints.reason}
      data-invalid={$errors.reason}
    >
      <option disabled selected>Reason for the Dispute</option>
      {#each reasons as reason}
        <option>{reason}</option>
      {/each}
    </select>
    {#if $errors.reason}<span class="text-error">{$errors.reason}</span>{/if}

    <!-- Explanation Textarea -->

    <span class="daisy-label-text">Explanation</span>
    <textarea name="explanation" class="textarea h-24" />

    <footer class="text-right font-semibold">
      <div class="py-4 text-center">
        <button
          class="neon-primary variant-soft-primary btn gap-2"
          type="submit"
          disabled={$delayed}
          >{#if $delayed}Submit <Icon icon="eos-icons:loading" />{/if}</button
        >
      </div>
      {#if $message}
        <br />
        <p class="mt-2 text-error">{$message}</p>
      {/if}
    </footer>
  </form>
{/if}
