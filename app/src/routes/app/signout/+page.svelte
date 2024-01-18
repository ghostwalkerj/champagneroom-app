<script lang="ts">
  import NeonBlur from '$components/NeonBlur.svelte';
  import urlJoin from 'url-join';

  import Config from '$lib/config';
  import type { PageData } from './$types';

  export let data: PageData;

  let { returnPath } = data;
  const authPath = urlJoin(
    Config.PATH.auth,
    '?returnPath=' + encodeURIComponent(returnPath!)
  );
</script>

<div
  class="bg-surface-900/95 flex flex-col gap-8 p-6 text-center items-center rounded"
>
  <div class="font-semibold text-3xl w-full">You have been signed out</div>

  {#if returnPath !== undefined}
    <NeonBlur>
      <a href={authPath} class="btn btn-lg variant-filled rounded-lg relative"
        >Sign in</a
      >
    </NeonBlur>
  {/if}
</div>
