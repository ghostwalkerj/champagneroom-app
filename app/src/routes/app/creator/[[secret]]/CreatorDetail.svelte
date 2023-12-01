<script lang="ts">
  import ProfilePhoto from '$components/ProfilePhoto.svelte';
  import Config from '$lib/config';
  import type { CreatorDocumentType } from '$lib/models/creator';
  import StarRating from 'svelte-star-rating';

  export let creator: CreatorDocumentType;

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
    <div class="bg-primary text-primary-content card">
      <div class="text-center card-body items-center p-3">
        <h2 class="text-xl card-title">{creator.user.name}</h2>
        <div>
          <ProfilePhoto
            profileImage={creator.user.profileImageUrl ||
              Config.UI.defaultProfileImage}
            callBack={(value) => {
              updateProfileImage(value);
            }}
          />
        </div>
        <div
          class="tooltip"
          data-tip={creator.feedbackStats.averageRating.toFixed(2)}
        >
          <StarRating rating={creator.feedbackStats.averageRating} />
        </div>
      </div>
    </div>
  </div>
</div>
