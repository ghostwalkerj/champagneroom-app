<script lang="ts">
  import { popup, type PopupSettings } from '@skeletonlabs/skeleton';
  import { copy } from '@svelte-put/copy';

  export let copyValue = '';

  const popupHover: PopupSettings = {
    event: 'hover',
    target: 'popupHover',
    placement: 'top'
  };

  $: copied = false;
  async function handleCopied() {
    copied = true;
    const clipboardItem = new ClipboardItem({
      'text/plain': new Blob([copyValue], { type: 'text/plain' }),
      'text/html': new Blob([copyValue], { type: 'text/html' })
    });
    await navigator.clipboard.write([clipboardItem]);
    setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<div class="card variant-filled-secondary p-4 text-xs" data-popup="popupHover">
  <p>Click to copy</p>
</div>

{#if copied}
  <span class="text-success-500">Copied!</span>
{:else}
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    class={$$props.class + ' [&>*]:pointer-events-none'}
    use:copy={{ text: copyValue }}
    use:popup={popupHover}
    on:copied={handleCopied}
    on:click|preventDefault
  >
    <slot />
  </span>
{/if}
