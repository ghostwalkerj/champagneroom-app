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
    <div class="capitalize absolute top-4 left-4 font-extrabold text-white">
      {creator.user.name}
    </div>
    <div
      class="text-center p-4 w-[1168px] h-[204px] overflow-hidden items-center justify-center object-cover flex"
      style="background-image: url({room.bannerImageUrl})"
    >
      <div
        class="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 capitalize"
      >
        {room.name}
      </div>
    </div>

    <div class="absolute -bottom-24 left-0 text-center">
      <Avatar
        class="ml-4 mb-4 w-32"
        src={creator.user.profileImageUrl}
        border="border-4 border-surface-300-600-token hover:border-primary"
        cursor="cursor-pointer"
      />
      <span
        class="badge-icon variant-filled-success absolute top-3 right-4 z-10"
      />
      <div class="capitalize font-extrabold">
        {creator.user.name}
      </div>
      <div>Last seen recently</div>
    </div>
  </div>

  <div
    class="p-4 flex flex-col gap-3 min-w-full md:min-w-min max-w-7xl md:grid md:grid-cols-4"
  >
    <!-- 1st column -->
    <div class="flex-1 space-y-3 md:col-start-1 md:col-span-1">Col 1</div>

    <!-- 2nd column -->
    <div class="space-y-3 md:col-start-2 md:col-span-2">Col 2</div>

    <!--Next Column-->
    <div class="space-y-3 md:col-start-4 md:col-span-1">Col 3</div>
  </div>
</div>
