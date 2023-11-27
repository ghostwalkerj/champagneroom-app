<script lang="ts">
  import { goto } from '$app/navigation';
  import urlJoin from 'url-join';

  import type { ActionData, PageData } from './$types';
  import Config from '$lib/config';

  export let data: PageData;
  export let form: ActionData;

  let { returnPath } = data;
  const authPath = urlJoin(
    Config.Path.auth,
    '?returnPath=' + encodeURIComponent(returnPath!)
  );
</script>

<div class="w-screen bg-base flex flex-col p-6 text-center items-center">
  <div class="font-bold text-5xl text-primary w-full font-CaviarDreams">
    You have been signed out
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  {#if returnPath !== undefined}
    <div
      class="m-4 lg:m-10 btn btn-outline btn-primary"
      on:click={() => {
        goto(authPath);
      }}
    >
      Sign In Again
    </div>
  {/if}
</div>
