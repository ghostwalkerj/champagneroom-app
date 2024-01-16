<script lang="ts">
  import { applyAction, deserialize } from '$app/forms';
  import Icon from '@iconify/svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import type { ActionResult } from '@sveltejs/kit';
  import type { SvelteComponent } from 'svelte';
  import { superForm } from 'sveltekit-superforms/client';

  // Props
  /** Exposes parent props to this component. */
  export let parent: SvelteComponent;

  const modalStore = getModalStore();

  const { form, errors, constraints, enhance, delayed, message } = superForm(
    $modalStore[0].meta.form,
    {
      validationMethod: 'auto',
      onResult: ({ result }) => {
        if (result.type === 'success') {
          // VERIFY THIS IS CORRECT
          console.log(result.data);
          setPinAuth(result.data!.userId, result.data!.form.data.pin);
        }
      }
    }
  );

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
            <input
              class="input variant-form-material"
              {...$constraints.pin}
              type="number"
              name="pin"
              bind:value={$form.pin}
            />
            <span>Save the PIN to access the ticket later!</span><br />
            {#if $errors.pin}<span class="text-error">{$errors.pin}</span>{/if}
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
            >Submit Form {#if $delayed}<Icon
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
