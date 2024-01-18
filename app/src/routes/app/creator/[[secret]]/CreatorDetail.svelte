<script lang="ts">
  import ImageUploadForm from '$components/forms/ImageUploadForm.svelte';
  import config from '$lib/config';
  import type { CreatorDocument } from '$lib/models/creator';
  import Icon from '@iconify/svelte';
  import StarRating from 'svelte-star-rating';

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

  <div class="flex gap-1">
    <StarRating rating={creator.feedbackStats.averageRating} /> ({creator.feedbackStats.averageRating.toFixed(
      2
    )})
  </div>
</div>
