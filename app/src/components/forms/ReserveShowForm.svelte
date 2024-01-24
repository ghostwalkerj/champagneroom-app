<script lang="ts">
  import { applyAction, deserialize } from '$app/forms';
  import type { reserveTicketSchema } from '$lib/models/common';
  import Icon from '@iconify/svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { ActionResult } from '@sveltejs/kit';
  import type { SvelteComponent } from 'svelte';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { arrayProxy, superForm } from 'sveltekit-superforms/client';

  // Props
  /** Exposes parent props to this component. */
  export let parent: SvelteComponent;

  const modalStore = getModalStore();

  const theForm = superForm(
    $modalStore[0].meta.form as SuperValidated<typeof reserveTicketSchema>,
    {
      validationMethod: 'auto',
      onResult: ({ result }) => {
        if (result.type === 'success') {
          // VERIFY THIS IS CORRECT
          setPinAuth(result.data!.userId, result.data!.form.data.pin);
        }
      }
    }
  );

  const { form, errors, constraints, enhance, delayed, message } = theForm;
  const setPinAuth = async (userId: string, pin: string) => {
    const body = new FormData();
    body.append('pin', pin);
    body.append('userId', userId);
    const response = await fetch('?/pin_auth', {
      method: 'POST',
      body,
      redirect: 'follow'
    });

    const result: ActionResult = deserialize(await response.text());
    applyAction(result);
  };
</script>

{#if $modalStore[0]}
  <div class="bg-surface-900 max-w-3xl rounded">
    <form
      class="grid sm:grid-cols-2"
      method="POST"
      use:enhance
      action={$modalStore[0].meta.action}
    >
      <input
        type="hidden"
        name="profileImage"
        value={$modalStore[0].meta.profileImage}
      />

      <img
        src={$modalStore[0].meta.profileImage}
        alt="profile"
        class="hidden sm:block rounded-l h-auto"
      />

      <div class="p-4 flex flex-col gap-4 justify-between">
        <div class="flex flex-col gap-4">
          <label class="label">
            <span class="font-semibold">Name</span>
            <input
              class="input variant-form-material"
              {...$constraints.name}
              type="text"
              placeholder="Enter name..."
              name="name"
              bind:value={$form.name}
            />
            {#if $errors.name}<span class="text-error">{$errors.name}</span
              >{/if}
          </label>
          <label class="label">
            <span class="font-semibold">8 digit numeric PIN</span>
            <div class="flex gap-1 text-center">
              {#each $form.pin as _, i}
                <span>
                  <input
                    name="pin"
                    bind:value={$form.pin[i]}
                    class="input variant-form-material"
                    maxlength="1"
                  />
                </span>
              {/each}
            </div>

            {#each $form.pin as _, i}
              {#if $errors.pin && $errors.pin[i]}
                <div class="text-error">{$errors.pin[i]}</div>
              {/if}
            {/each}

            <span>Save the PIN to access the ticket later!</span><br />
          </label>
        </div>

        <footer class="text-right font-semibold">
          <button
            class="btn variant-filled-surface"
            disabled={$delayed}
            type="button"
            on:click={parent.onClose}>{parent.buttonTextCancel}</button
          >
          <button
            class="btn variant-filled-primary gap-2"
            disabled={$delayed}
            type="submit"
            >Reserve {#if $delayed}<Icon
                icon="eos-icons:loading"
              />{/if}</button
          >
          {#if $message}
            <br />
            <p class="text-error mt-2">{$message}</p>
          {/if}
        </footer>
      </div>
    </form>
  </div>
{/if}
