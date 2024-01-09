<script lang="ts">
  import ImageUploadForm from '$components/forms/ImageUploadForm.svelte';
  import Config from '$lib/config';
  import type { CreatorDocument } from '$lib/models/creator';
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


    <div class="bg-custom rounded flex flex-col justify-center text-center items-center">

        <div>
          <ImageUploadForm
            imageUrl={creator.user.profileImageUrl ||
              Config.UI.defaultProfileImage}
            callBack={(value) => {
              updateProfileImage(value);
            }}
          />
        </div>

        <div class="flex gap-1 mt-2">
          <StarRating rating={creator.feedbackStats.averageRating} /> ({creator.feedbackStats.averageRating.toFixed(2)})
        
        </div>

    </div>

