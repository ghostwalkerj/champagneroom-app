<script lang="ts">
  import { goto } from '$app/navigation';
  import urlJoin from 'url-join';
  import NeonBlur from '$components/NeonBlur.svelte';

  import Config from '$lib/config';
  import type { PageData } from './$types';

  export let data: PageData;

  let { returnPath } = data;
  const authPath = urlJoin(
    Config.PATH.auth,
    '?returnPath=' + encodeURIComponent(returnPath!)
  );
</script>

<div class="w-screen bg-base flex flex-col gap-8 p-6 text-center items-center">
  <div class="font-bold text-5xl w-full">
    You have been signed out
  </div>

  {#if returnPath !== undefined}
    <NeonBlur>
      <a href={authPath} class="btn btn-lg variant-filled rounded-lg relative">Sign in</a>
    </NeonBlur>
  {/if}
</div>
