<script lang="ts">
  import Icon from '@iconify/svelte';
  import { Ratings } from '@skeletonlabs/skeleton';

  import type { CreatorDocument } from '$lib/models/creator';

  import ImageUploadForm from '$components/ImageUploadForm.svelte';

  export let creator: CreatorDocument;

  $: profileImageUrl = creator.user.profileImageUrl;
</script>

<div
  class="bg-custom flex flex-col items-center justify-center rounded pt-4 text-center"
>
  <h2 class="flex items-center gap-2 text-xl font-semibold">
    <Icon class="text-secondary-500" icon="iconoir:profile-circle" />
    Profile
  </h2>

  <ImageUploadForm imageUrl={profileImageUrl} action="?/update_profile_image" />

  <div class="m-1 flex w-full justify-center text-2xl">
    <Ratings
      value={creator.feedbackStats.averageRating ?? 0}
      max={5}
      text="text-yellow-400"
      spacing="m-0"
      class="m-2 max-w-min"
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
    <span class="mt-2 text-surface-500">
      ({creator.feedbackStats.averageRating.toFixed(2) ?? 0})</span
    >
  </div>
</div>
