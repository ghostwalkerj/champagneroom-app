<script lang="ts">
  import type { creatorCRUDSchema } from '$lib/models/creator';
  import Icon from '@iconify/svelte';
  import { FileDropzone, getModalStore } from '@skeletonlabs/skeleton';
  import type { SvelteComponent } from 'svelte';
  import type { SuperValidated } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms/client';
  import urlJoin from 'url-join';

  const modalStore = getModalStore();
  $: thisModal = $modalStore[0];

  let images: FileList;
  export let parent: SvelteComponent;

  let creatorForm = $modalStore[0].meta.form as SuperValidated<
    typeof creatorCRUDSchema
  >;

  const { form, errors, constraints, enhance, delayed, message } = superForm(
    creatorForm,
    {
      validationMethod: 'submit-only',
      async onResult(event) {
        if (event.result.type === 'success') {
          modalStore.close();
        }
      }
    }
  );
</script>

{#if thisModal}
  <div class="bg-surface-900 max-w-3xl rounded">
    <form
      class="grid sm:grid-cols-2"
      method="POST"
      enctype="multipart/form-data"
      use:enhance
      action={thisModal.meta.action}
    >
      <input type="hidden" name="active" value="true" />
      <input type="hidden" name="_id" value={$form._id} />

      <FileDropzone
        name="images"
        padding="p-0"
        class="bg-surface-900 max-h-max overflow-hidden rounded-xl "
        bind:files={images}
        accept="image/*"
        on:change={() => {
          if (images.length > 0) {
            $form.user.profileImageUrl = URL.createObjectURL(images[0]);
          }
        }}
      >
        <svelte:fragment slot="message">
          <div>
            <img src={$form.user.profileImageUrl} alt="coverImageUrl" />
          </div>
          <div class="label font-semibold p-4">Upload Profile Image</div>
        </svelte:fragment>
      </FileDropzone>

      <div class="p-4 flex flex-col gap-4 justify-between">
        <div class="flex flex-col gap-4">
          <label class="label">
            <span class="font-semibold">Name</span>
            <input
              class="input variant-form-material"
              {...$constraints.user?.name}
              type="text"
              placeholder="Enter name..."
              name="name"
              bind:value={$form.user.name}
            />
            {#if $errors.user?.name}<span class="text-error"
                >{$errors.user.name}</span
              >{/if}
          </label>

          <label class="label">
            <span class="font-semibold">Tag Line</span>
            <input
              class="input variant-form-material"
              {...$constraints.tagLine}
              type="text"
              name="tagLine"
              bind:value={$form.tagLine}
              placeholder="Enter a tagline..."
            />
            {#if $errors.tagLine}<span class="text-error"
                >{$errors.tagLine}</span
              >{/if}
          </label>

          <label class="label">
            <span class="font-semibold">Unique Room Url </span>
            <input
              class="input variant-form-material"
              {...$constraints.uniqueUrl}
              type="text"
              name="uniqueUrl"
              bind:value={$form.uniqueUrl}
            />
            <div class="pt-1 text-sm">
              {urlJoin(roomUrl, $form.uniqueUrl)}
            </div>

            {#if $errors.uniqueUrl}<span class="text-error"
                >{$errors.uniqueUrl}</span
              >{/if}
          </label>

          <!-- <label class="label">
            <span class="font-semibold">Announcement</span>
            <input
              class="input variant-form-material"
              {...$constraints.announcement}
              type="text"
              name="uniqueUrl"
              bind:value={$form.announcement}
              placeholder="Enter any announcement ..."
            />
            {#if $errors.announcement}<span class="text-error"
                >{$errors.announcement}</span
              >{/if}
          </label> -->
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
            >Submit {#if $delayed}<Icon icon="eos-icons:loading" />{/if}</button
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
