<script lang="ts">
  import type { PageData } from './$types';
  import type { RoomDocumentType } from '$lib/models/room';

  export let data: PageData;

  $: room = data.room as RoomDocumentType;
</script>

{#if room}
  {room.name}
{/if}
<!-- Banner -->
<div class="text-center p-4 w-[1168px] h-[204px] overflow-hidden">
  <!-- svelte-ignore a11y-img-redundant-alt -->

  <img src={room.bannerImageUrl} alt="Banner Image" />
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
