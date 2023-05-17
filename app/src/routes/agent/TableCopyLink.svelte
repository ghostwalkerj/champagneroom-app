<script lang="ts">
  import { page } from '$app/stores';
  import { PUBLIC_TALENT_PATH } from '$env/static/public';
  import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';
  import urlJoin from 'url-join';

  export let row;
  export let col;

  $: url = urlJoin($page.url.origin, PUBLIC_TALENT_PATH, row.url);
  let tooltipOpen = '';

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    tooltipOpen = 'tooltip-open';
    setTimeout(() => (tooltipOpen = ''), 2000);
  };
</script>

{#key row.id}
  <button on:click="{copyUrl}">
    <div class="cursor-pointer flex group">
      <div class="h-5 mr-1 mb-1 pl-2 group-hover:text-black">
        <FaRegCopy />
      </div>
      <div class="text-sm text-gray-400 group-hover:text-black">
        <div class="tooltip tooltip-success {tooltipOpen}" data-tip="Copied!">
          Copy
        </div>
      </div>
    </div>
  </button>
{/key}
