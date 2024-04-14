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
  async function handleCopied(e: CustomEvent<CopyDetail>) {
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
  <div
    class="neon-primary bg-custom border-primary-content rounded border-2 p-4"
    data-popup="popupHover"
  >
    {copyValue}
  </div>
{/if}

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
