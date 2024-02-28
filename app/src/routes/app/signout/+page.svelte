<script lang="ts">
  import NeonBlur from '$components/NeonBlur.svelte';
  import urlJoin from 'url-join';

  import config from '$lib/config';
  import type { PageData } from './$types';

  export let data: PageData;

  let { returnPath } = data;
  const authPath = urlJoin(
    config.PATH.auth,
    '?returnPath=' + encodeURIComponent(returnPath!)
  );
</script>

<div
  class="flex flex-col items-center gap-8 rounded bg-surface-900/95 p-6 text-center"
>
  <div class="w-full text-3xl font-semibold">You have been signed out</div>

  {#if returnPath !== undefined}
    <NeonBlur>
      <a href={authPath} class="variant-filled btn btn-lg relative rounded-lg"
        >Sign in</a
      >
    </NeonBlur>
  {/if}
</div>
