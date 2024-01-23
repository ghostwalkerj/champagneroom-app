<script lang="ts">
  import ImageUploadForm from '$components/forms/ImageUploadForm.svelte';
  import config from '$lib/config';
  import type { CreatorDocument } from '$lib/models/creator';
  import Icon from '@iconify/svelte';
  import { Ratings } from '@skeletonlabs/skeleton';

  export let creator: CreatorDocument;

  const updateProfileImage = async (url: string) => {
    if (url && creator) {
      creator.user.profileImageUrl = url;
      let formData = new FormData();
      formData.append('url', url);
      await fetch('?/update_profile_image', {
        method: 'POST',
        body: formData
      });
    }
  };
</script>

<div
  class="bg-custom rounded pt-4 flex flex-col justify-center text-center items-center"
>
  <h2 class="text-xl font-semibold flex gap-2 items-center">
    <Icon class="text-secondary" icon="iconoir:profile-circle" />
    Profile
  </h2>
  <div>
    <ImageUploadForm
      imageUrl={creator.user.profileImageUrl || config.UI.defaultProfileImage}
      callBack={(value) => {
        updateProfileImage(value);
      }}
    />
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
