<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import { Image } from '@unpic/svelte';
  import type { SvelteComponent } from 'svelte';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';
  import { zod } from 'sveltekit-superforms/adapters';
  import { superForm } from 'sveltekit-superforms/client';

  import { reserveTicketSchema } from '$lib/models/common';

  import config from '$lib/config';
  import getProfileImage from '$lib/profilePhoto';

  // Props
  /** Exposes parent props to this component. */
  export let parent: SvelteComponent;
  const modalStore = getModalStore();

  const theForm = superForm(
    $modalStore[0].meta.form as SuperValidated<
      Infer<typeof reserveTicketSchema>
    >,
    {
      validators: zod(reserveTicketSchema),

      onResult: ({ result }) => {
        if (result.type === 'success' || result.type === 'redirect') {
          modalStore.close();
        }
      }
    }
  );

  const { form, errors, constraints, enhance, delayed, message, allErrors } =
    theForm;
  let profileImage = getProfileImage($form.name, config.UI.profileImagePath);
</script>

{#if $modalStore[0]}
  <div class="max-w-3xl rounded bg-surface-900">
    <form
      class="grid sm:grid-cols-2"
      method="POST"
      use:enhance
      action={$modalStore[0].meta.action}
    >
      <input type="hidden" name="profileImage" bind:value={profileImage} />
      <input type="hidden" name="pin" bind:value={$form.pin} />

      <Image
        src={profileImage}
        alt="profile"
        height={500}
        width={500}
        class="hidden h-auto rounded-l sm:block"
        loading="eager"
      />

      <div class="flex flex-col justify-between gap-4 p-4">
        <div class="flex flex-col gap-4">
          <label class="label">
            <span class="font-semibold">Name</span>
            <input
              class="input variant-form-material"
              class:input-error={$errors.name}
              aria-invalid={$errors.name ? 'true' : 'false'}
              {...$constraints.name}
              type="text"
              placeholder="Enter name..."
              name="name"
              bind:value={$form.name}
              on:input={() => {
                profileImage = getProfileImage(
                  $form.name,
                  config.UI.profileImagePath
                );
              }}
            />
            {#if $errors.name}<span class="text-error-500">{$errors.name}</span
              >{/if}
          </label>
          <label class="label">
            <span class="font-semibold">8 digit numeric PIN</span>
            <div class="flex gap-1 text-center">
              {#each { length: config.UI.pinLength - 1 } as _, index}
                <span>
                  <input
                    class="input variant-form-material"
                    class:input-error={$errors.pin && $errors.pin[index]}
                    name="pin"
                    maxlength="1"
                    aria-invalid={$errors.pin && $errors.pin[index]
                      ? 'true'
                      : undefined}
                    bind:value={$form.pin[index]}
                  />
                </span>
              {/each}
            </div>

            <span>Save PIN to access the ticket later!</span><br />
          </label>

          {#if $allErrors.length}
            <ul>
              {#each $allErrors as error}
                <li>
                  {error.messages.join('. ')}
                </li>
              {/each}
            </ul>
          {/if}
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
