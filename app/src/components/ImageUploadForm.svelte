<script lang="ts">
  // TODO:Add validation
  import { FileButton, FileDropzone } from '@skeletonlabs/skeleton';
  import type { ActionResult } from '@sveltejs/kit';
  import { onMount } from 'svelte';

  import { applyAction, enhance } from '$app/forms';

  export let action: string;
  export let imageUrl: string;

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
    <div class="flex flex-col items-center gap-3">
      <FileDropzone
        name="images"
        bind:files={images}
        bind:fileInput={fileDrop}
        accept="image/*"
        class="max-h-32 max-w-32 overflow-hidden"
        rounded="rounded-full"
        on:change={onChange}
      >
        <svelte:fragment slot="message">
          <img
            src={imageUrl}
            alt="profileImage"
            class="relative max-h-32 max-w-32 rounded-full bg-cover bg-center bg-no-repeat"
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
            class="neon-primary variant-soft-primary btn btn-sm"
            type="submit"
          >
            Save
          </button>
          <button
            class="neon-secondary variant-soft-secondary btn btn-sm"
            on:click={resetForm}
          >
            Cancel
          </button>
        </div>
      {/if}
    </div>
  </form>
</div>
