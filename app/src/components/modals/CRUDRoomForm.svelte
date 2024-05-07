<script lang="ts">
  import Icon from '@iconify/svelte';
  import { FileDropzone, getModalStore } from '@skeletonlabs/skeleton';
  import { type SvelteComponent } from 'svelte';
  import type { Infer, SuperValidated } from 'sveltekit-superforms';
  import { superForm } from 'sveltekit-superforms/client';
  import urlJoin from 'url-join';

  import { page } from '$app/stores';

  import type { roomCRUDSchema } from '$lib/models/room';

  import config from '$lib/config';

  const modalStore = getModalStore();
  $: thisModal = $modalStore[0];

  let images: FileList;
  export let parent: SvelteComponent;

  let roomForm = $modalStore[0].meta.form as SuperValidated<
    Infer<typeof roomCRUDSchema>
  >;

  const { form, errors, constraints, enhance, delayed, message } = superForm(
    roomForm,
    {
      onResult(event) {
        console.log(event);
        if (event.result.type === 'success') {
          parent.onClose();
        }
      }
    }
  );

  $: roomUrl = urlJoin($page.url.origin, config.PATH.room);
</script>

{#if thisModal}
  <div class="max-w-3xl rounded bg-surface-900">
    <form
      class="grid sm:grid-cols-2"
      method="POST"
      enctype="multipart/form-data"
      use:enhance
      action={thisModal.meta.action}
    >
      <input type="hidden" name="active" value={true} />
      <input type="hidden" name="_id" bind:value={roomForm.data._id} readonly />

      <FileDropzone
        name="images"
        padding="p-0"
        class="max-h-max overflow-hidden rounded-xl bg-surface-900 "
        bind:files={images}
        accept="image/*"
        on:change={() => {
          if (images.length > 0) {
            $form.image = images[0];
          }
        }}
      >
        <svelte:fragment slot="message">
          <div>
            <img src={$form.bannerImageUrl} alt="coverImageUrl" />
          </div>
          <div class="label p-4 font-semibold">Upload Room Cover Image</div>
        </svelte:fragment>
      </FileDropzone>

      <div class="flex flex-col justify-between gap-4 p-4">
        <div class="flex flex-col gap-4">
          <label class="label">
            <span class="font-semibold">Room Name</span>
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
            <span class="font-semibold">Tag Line</span>
            <input
              class="input variant-form-material"
              {...$constraints.tagLine}
              type="text"
              name="tagLine"
              bind:value={$form.tagLine}
              placeholder="Enter a tagline..."
            />
            {#if $errors.tagLine}<span class="text-error-500"
                >{$errors.tagLine}</span
              >{/if}
          </label>

          <label class="label">
            <span class="font-semibold">Unique Room Url</span>
            <input
              class="input variant-form-material"
              {...$constraints.uniqueUrl}
              type="text"
              name="uniqueUrl"
              bind:value={$form.uniqueUrl}
            />
            <div class="pt-1 text-sm">
              {urlJoin(roomUrl, $form.uniqueUrl.toLocaleLowerCase())}
            </div>

            {#if $errors.uniqueUrl}<span class="text-error-500"
                >{$errors.uniqueUrl}</span
              >{/if}
          </label>

          <label class="label">
            <span class="font-semibold">Announcement</span>
            <input
              class="input variant-form-material"
              {...$constraints.announcement}
              type="text"
              name="announcement"
              bind:value={$form.announcement}
              placeholder="Enter any announcement ..."
            />
            {#if $errors.announcement}<span class="text-error-500"
                >{$errors.announcement}</span
              >{/if}
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
            >Submit {#if $delayed}<Icon icon="eos-icons:loading" />{/if}</button
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
