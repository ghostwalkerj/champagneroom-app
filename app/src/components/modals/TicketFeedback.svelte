<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getModalStore, Ratings } from '@skeletonlabs/skeleton';
  import type { SvelteComponent } from 'svelte';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms/client';

  import type { ticketFeedbackSchema } from '$lib/models/common';

  // Props
  /** Exposes parent props to this component. */
  export let parent: SvelteComponent;
  const modalStore = getModalStore();

  let meta = $modalStore[0].meta;
  let action = meta.action;
  let ticketFeedbackForm = $modalStore[0].meta.form as SuperValidated<
    Infer<typeof ticketFeedbackSchema>
  >;

  const { form, errors, constraints, enhance, delayed, message } = superForm(
    ticketFeedbackForm,
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
  <form
    method="post"
    {action}
    use:enhance
    class="flex max-w-3xl flex-col gap-4 rounded bg-surface-900 p-4"
  >
    <h3 class="text-center text-lg font-bold lg:text-xl">Leave Feedback</h3>

    <div class="py-2">
      <Ratings
        text="text-yellow-400"
        {...$constraints.rating}
        max={5}
        bind:value={$form.rating}
        spacing="m-0"
        class="m-2 max-w-min"
      >
        <svelte:fragment slot="empty">
          <Icon icon="fluent:star-28-regular" />
        </svelte:fragment>
        <svelte:fragment slot="half"
          ><Icon icon="fluent:star-half-28-regular" /></svelte:fragment
        >
        <svelte:fragment slot="full"
          ><Icon icon="fluent:star-28-filled" /></svelte:fragment
        >
      </Ratings>
      {#if $errors.rating}<span class="text-error">{$errors.rating}</span>{/if}
    </div>
    <div class="w-full py-2">
      <span class="label-text">Review</span>
      <div class="relative mt-1 rounded-md shadow-sm">
        <textarea
          name="review"
          class="form-input w-full"
          bind:value={$form.review}
          {...$constraints.review}
          placeholder="Enter review..."
        />
      </div>
    </div>

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
{/if}
