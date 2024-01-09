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

<div>
  <div class="lg:col-start-3 lg:col-span-1">
    <div class="bg-primary text-primary-content daisy-card">
      <div class="text-center daisy-card-body items-center p-3">
        <h2 class="text-xl daisy-card-title">{creator.user.name}</h2>
        <div>
          <ImageUploadForm
            imageUrl={creator.user.profileImageUrl ||
              Config.UI.defaultProfileImage}
            callBack={(value) => {
              updateProfileImage(value);
            }}
          />
        </div>
        <div
          class="daisy-tooltip"
          data-tip={creator.feedbackStats.averageRating.toFixed(2)}
        >
          <StarRating rating={creator.feedbackStats.averageRating} />
        </div>
      </div>
    </div>
  </div>
</div>
