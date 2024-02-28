<script lang="ts">
  import type { CreatorDocument } from '$lib/models/creator';
  import type { RoomDocumentType } from '$lib/models/room';
  import { Avatar } from '@skeletonlabs/skeleton';
  import type { PageData } from './$types';
  export let data: PageData;

  $: room = data.room as RoomDocumentType;
  $: creator = data.creator as CreatorDocument;
</script>

<!-- Banner -->
<div>
  <div class="relative">
    <div class="absolute left-4 top-4 font-extrabold capitalize text-white">
      {creator.user.name}
    </div>
    <div
      class="flex h-[204px] w-[1168px] items-center justify-center overflow-hidden object-cover p-4 text-center"
      style="background-image: url({room.bannerImageUrl})"
    >
      <div
        class="bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 bg-clip-text text-5xl font-extrabold capitalize text-transparent"
      >
        {room.name}
      </div>
    </div>

    <div class="absolute -bottom-24 left-0 text-center">
      <Avatar
        class="mb-4 ml-4 w-32"
        src={creator.user.profileImageUrl}
        border="border-4 border-surface-300-600-token hover:border-primary"
        cursor="cursor-pointer"
      />
      <span
        class="variant-filled-success badge-icon absolute right-4 top-3 z-10"
      />
      <div class="font-extrabold capitalize">
        {creator.user.name}
      </div>
      <div>Last seen recently</div>
    </div>
  </div>

  <div
    class="flex min-w-full max-w-7xl flex-col gap-3 p-4 md:grid md:min-w-min md:grid-cols-4"
  >
    <!-- 1st column -->
    <div class="flex-1 space-y-3 md:col-span-1 md:col-start-1">Col 1</div>

    <!-- 2nd column -->
    <div class="space-y-3 md:col-span-2 md:col-start-2">Col 2</div>

    <!--Next Column-->
    <div class="space-y-3 md:col-span-1 md:col-start-4">Col 3</div>
  </div>
</div>
