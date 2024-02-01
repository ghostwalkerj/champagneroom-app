<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { Avatar } from '@skeletonlabs/skeleton';

  // TODO:Add validation
  import { FileButton, FileDropzone } from '@skeletonlabs/skeleton';
  import type { ActionResult } from '@sveltejs/kit';
  import { onMount } from 'svelte';

  export let imageUrl: string;
  export let action: string;

  let images: FileList;
  let fileDrop: HTMLInputElement;
  let originalImageUrl: string;

  $: isChanged = false;

  function resetForm() {
    isChanged = false;
    imageUrl = originalImageUrl;
  }

  onMount(() => {
    originalImageUrl = imageUrl;
  });

  const onChange = () => {
    if (images.length === 0) return;
    isChanged = true;
    imageUrl = URL.createObjectURL(images[0]);
  };

  const onSubmit = () => {
    isChanged = false;
    return async ({ result }: { result: ActionResult }) => {
      if (result.type === 'success' && result.data) {
        imageUrl = result.data.imageUrl;
      }
      await applyAction(result);
    };
  };
</script>

<div class="pt-4">
  <form
    method="POST"
    enctype="multipart/form-data"
    use:enhance={onSubmit}
    {action}
  >
    <div class="flex flex-col gap-3 items-center">
      <FileDropzone
        name="images"
        bind:files={images}
        bind:fileInput={fileDrop}
        accept="image/*"
        class="w-32 h-32 "
        rounded="rounded-full"
        padding="p-0"
        on:change={onChange}
      >
        <svelte:fragment slot="message">
          <Avatar
            src={imageUrl}
            alt="profileImage"
            rounded="rounded-full"
            width="full"
          />
        </svelte:fragment>
      </FileDropzone>
      {#if !isChanged}
        <FileButton
          name="imageButton"
          bind:files={images}
          fileInput={fileDrop}
          on:change={onChange}
          button="btn variant-soft-secondary btn-sm neon-secondary"
          >Change Image</FileButton
        >
      {:else}
        <div class="flex gap-2">
          <button
            class="btn variant-soft-primary btn-sm neon-primary"
            type="submit"
          >
            Save
          </button>
          <button
            class="btn variant-soft-secondary btn-sm neon-secondary"
            on:click={resetForm}
          >
            Cancel
          </button>
        </div>
      {/if}
    </div>
  </form>
</div>
