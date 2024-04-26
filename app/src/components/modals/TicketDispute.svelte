<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { SvelteComponent } from 'svelte';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms';

  import type { ticketDisputeSchema } from '$lib/models/common';

  import { DisputeReason } from '$lib/constants';

  const reasons = Object.values(DisputeReason);

  export let parent: SvelteComponent;
  const modalStore = getModalStore();

  let meta = $modalStore[0].meta;
  let action = meta.action;
  let ticketDisputeForm = $modalStore[0].meta.form as SuperValidated<
    Infer<typeof ticketDisputeSchema>
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
      // validators: valibotClient({
      //   reason: reason in DisputeReason ? undefined : 'Please select a reason'
      // }) // TODO: Add other validators
    }
  );
</script>

{#if $modalStore[0]}
  <!-- Form -->
  <div class="rounded bg-surface-900 p-4">
    <form method="post" {action} use:enhance class="space-y-4">
      <h3 class="text-center text-lg font-bold lg:text-xl">Initiate Dispute</h3>

      <!-- Reason for Dispute Dropdown -->
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

      <span class="label-text">Explanation</span>
      <textarea
        name="explanation"
        class="textarea h-24"
        bind:value={$form.explanation}
        {...$constraints.explanation}
      />

      {#if $errors.explanation}<span class="text-error"
          >{$errors.explanation}</span
        >{/if}

      <footer class="text-right font-semibold">
        <div class="py-4 text-center">
          <button
            class="neon-primary variant-soft-primary btn gap-2"
            type="submit"
            disabled={$delayed}
            >Submit{#if $delayed}
              <Icon icon="eos-icons:loading" />{/if}</button
          >
          <button
            class="variant-soft-surface btn"
            type="button"
            on:click={parent.onClose()}
          >
            Cancel
          </button>
        </div>
        {#if $message}
          <br />
          <p class="text-error mt-2">{$message}</p>
        {/if}
      </footer>
    </form>
  </div>
{/if}
