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

{#if copied}
  <slot name="copiedText">
    <span class="text-success-500">Copied!</span>
  </slot>
{:else}
  <div
    class="card variant-filled-secondary p-4 text-xs"
    data-popup="popupHover"
  >
    <slot name="hoverText">
      <span>Copy</span>
    </slot>
  </div>
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <span
    class={$$props.class + ' cursor-copy [&>*]:pointer-events-none'}
    use:copy={{ text: copyValue }}
    use:popup={popupHover}
    on:copied={handleCopied}
    on:click|preventDefault
  >
    <slot />
  </span>
{/if}
