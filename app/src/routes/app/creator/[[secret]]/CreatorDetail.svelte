<script lang="ts">
  import { enhance } from '$app/forms';

  import type { CreatorDocument } from '$lib/models/creator';
  import Icon from '@iconify/svelte';
  import { FileButton, FileDropzone, Ratings } from '@skeletonlabs/skeleton';

  export let creator: CreatorDocument;

  let images: FileList;
  let fileDrop: HTMLInputElement;
  $: changed = false;
  $: profileImageUrl = creator.user.profileImageUrl;

  const onChange = () => {
    if (images.length === 0) return;
    changed = true;
    profileImageUrl = URL.createObjectURL(images[0]);
  };
</script>

<div
  class="bg-custom rounded pt-4 flex flex-col justify-center text-center items-center"
>
  <h2 class="text-xl font-semibold flex gap-2 items-center">
    <Icon class="text-secondary" icon="iconoir:profile-circle" />
    Profile
  </h2>
  <div class="pt-6">
    <form
      method="POST"
      enctype="multipart/form-data"
      use:enhance
      action="?/update_profile_image"
    >
      <div class="flex flex-col gap-3 items-center">
        <FileDropzone
          name="images"
          bind:files={images}
          bind:fileInput={fileDrop}
          accept="image/*"
          class="overflow-hidden max-w-32 max-h-32"
          rounded="rounded-full"
          on:change={onChange}
        >
          <svelte:fragment slot="message">
            <img
              src={profileImageUrl}
              alt="profileImage"
              class="bg-cover relative bg-no-repeat bg-center rounded-full max-w-32 max-h-32"
            />
          </svelte:fragment>
        </FileDropzone>
        {#if !changed}
          <FileButton
            name="imageButton"
            bind:files={images}
            fileInput={fileDrop}
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
              on:click={() => {
                changed = false;
                profileImageUrl = creator.user.profileImageUrl;
              }}
            >
              Cancel
            </button>
          </div>
        {/if}
      </div>
    </form>
  </div>
  <div class="text-2xl flex w-full justify-center m-1">
    <Ratings
      value={creator.feedbackStats.averageRating ?? 0}
      max={5}
      text="text-yellow-400"
      spacing="m-0"
      class="max-w-min m-2"
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
    <span class="text-base mt-2">
      ({creator.feedbackStats.averageRating.toFixed(2) ?? 0})</span
    >
  </div>
</div>
