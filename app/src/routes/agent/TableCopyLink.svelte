<script lang="ts">
  import { page } from '$app/stores';
  import { PUBLIC_TALENT_PATH } from '$env/static/public';
  import urlJoin from 'url-join';

  export let row;

  $: url = urlJoin($page.url.origin, PUBLIC_TALENT_PATH, row.url);
  let tooltipOpen = '';

  const copyUrl = () => {
    navigator.clipboard.writeText(url);
    tooltipOpen = 'tooltip-open';
    setTimeout(() => (tooltipOpen = ''), 2000);
  };
</script>

{#key row.id}
  <button on:click={copyUrl}>
    <div class="cursor-pointer flex group">
      <div class="h-5 mr-1 mb-1 pl-2 group-hover:text-black">
        <iconify-icon icon="mingcute:copy-fill" />
      </div>
      <div class="text-sm text-gray-400 group-hover:text-black">
        <div class="tooltip tooltip-success {tooltipOpen}" data-tip="Copied!">
          Copy
        </div>
      </div>
    </div>
  </button>
{/key}
