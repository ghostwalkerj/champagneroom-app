<script lang="ts">
  import { popup, type PopupSettings } from '@skeletonlabs/skeleton';
  import { copy, type CopyDetail } from '@svelte-put/copy';

  export let copyValue = '';

  const popupHover: PopupSettings = {
    event: 'hover',
    target: 'popupHover',
    placement: 'top'
  };

  $: copied = false;
  function handleCopied(e: CustomEvent<CopyDetail>) {
    copied = true;
    navigator.clipboard.writeText(copyValue);
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

{#if copied}
  <div
    class="neon-primary p-4 rounded bg-custom border-2 border-primary-content"
    data-popup="popupHover"
  >
    {copyValue}
  </div>
{/if}

{#if copied}
  <span class="text-success">Copied!</span>
{:else}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <button
    class={$$props.class}
    use:copy={{ text: copyValue }}
    use:popup={popupHover}
    on:copied={handleCopied}
    on:click|preventDefault><slot /></button
  >
{/if}
