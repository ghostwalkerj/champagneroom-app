<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import { Image } from '@unpic/svelte';
  import type { SvelteComponent } from 'svelte';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms/client';

  import type { reserveTicketSchema } from '$lib/models/common';

  // Props
  /** Exposes parent props to this component. */
  export let parent: SvelteComponent;

  const modalStore = getModalStore();

  const theForm = superForm(
    $modalStore[0].meta.form as SuperValidated<
      Infer<typeof reserveTicketSchema>
    >,
    {
      onResult: ({ result }) => {
        if (result.type === 'success' || result.type === 'redirect') {
          modalStore.close();
        }
      }
    }
  );

  const { form, errors, constraints, enhance, delayed, message } = theForm;
</script>

{#if $modalStore[0]}
  <div class="max-w-3xl rounded bg-surface-900">
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

      <Image
        src={$modalStore[0].meta.profileImage}
        alt="profile"
        height={500}
        width={500}
        loading="eager"
        class="hidden h-auto rounded-l sm:block"
      />

      <div class="flex flex-col justify-between gap-4 p-4">
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
            {#if $errors.name}<span class="text-error-500">{$errors.name}</span
              >{/if}
          </label>
          <label class="label">
            <span class="font-semibold">8 digit numeric PIN</span>
            <div class="flex gap-1 text-center">
              {#each $form.pin as index}
                <span>
                  <input
                    name="pin"
                    bind:value={$form.pin[index]}
                    class="input variant-form-material"
                    maxlength="1"
                  />
                </span>
              {/each}
            </div>

            {#each $form.pin as index}
              {#if $errors.pin && $errors.pin[index]}
                <div class="text-error-500">{$errors.pin[index]}</div>
              {/if}
            {/each}

            <span>Save the PIN to access the ticket later!</span><br />
          </label>
        </div>

        <footer class="text-right font-semibold">
          <button
            class="variant-filled-surface btn"
            disabled={$delayed}
            type="button"
            on:click={parent.onClose}>{parent.buttonTextCancel}</button
          >
          <button
            class="variant-filled-primary btn gap-2"
            disabled={$delayed}
            type="submit"
            >Reserve {#if $delayed}<Icon
                icon="eos-icons:loading"
              />{/if}</button
          >
          {#if $message}
            <br />
            <p class="mt-2 text-error-500">{$message}</p>
          {/if}
        </footer>
      </div>
    </form>
  </div>
{/if}
