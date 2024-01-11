<script lang="ts">
  import { page } from '$app/stores';
  import Config from '$lib/config';
  import { roomZodSchema } from '$lib/models/room';
  import Icon from '@iconify/svelte';
  import { FileDropzone, getModalStore } from '@skeletonlabs/skeleton';
  import { nanoid } from 'nanoid';
  import type { SvelteComponent } from 'svelte';
  import { superForm } from 'sveltekit-superforms/client';
  import urlJoin from 'url-join';
  export let parent: SvelteComponent;

  const modalStore = getModalStore();

  let images: FileList;
  let roomForm = $modalStore[0].meta.form;

  const { form, errors, constraints, enhance, delayed, message } = superForm(
    roomForm,
    {
      validators: roomZodSchema,
      validationMethod: 'auto',
      resetForm: true,
      invalidateAll: true,
      onResult(event) {
        if (event.result.type === 'success') {
          console.log(event.result.data);
          modalStore.close();
        }
      }
    }
  );

  if ($form.uniqueUrl === undefined) {
    $form.uniqueUrl = nanoid(10).toLowerCase();
  }
  if ($form.coverImageUrl === undefined) {
    $form.coverImageUrl = Config.UI.defaultProfileImage;
  }

  $: roomUrl = urlJoin($page.url.origin, Config.PATH.room);
</script>

{#if $modalStore[0]}
  <div class="bg-surface-900 max-w-3xl rounded">
    <form
      class="grid sm:grid-cols-2"
      method="POST"
      enctype="multipart/form-data"
      use:enhance
      action={$modalStore[0].meta.action}
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
            $form.coverImageUrl = URL.createObjectURL(images[0]);
          }
        }}
      >
        <svelte:fragment slot="message">
          <div>
            <img src={$form.coverImageUrl} alt="coverImageUrl" />
          </div>
          <div class="label font-semibold p-4">Upload Room Cover Image</div>
        </svelte:fragment>
      </FileDropzone>

      <div class="p-4 flex flex-col gap-4 justify-between">
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
            {#if $errors.name}<span class="text-error">{$errors.name}</span
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
            <div class="pt-1 text-sm">{urlJoin(roomUrl, $form.uniqueUrl)}</div>

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
