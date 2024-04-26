<script lang="ts">
  import Icon from '@iconify/svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import { onMount, type SvelteComponent } from 'svelte';
  import urlJoin from 'url-join';

  import { page } from '$app/stores';

  import config from '$lib/config';

  import CopyText from '$components/CopyText.svelte';

  export let parent: SvelteComponent;

  const modalStore = getModalStore();
  $: thisModal = $modalStore[0];
  $: user = thisModal && thisModal.meta.user;
  $: password = thisModal && thisModal.meta.password;
  let copyText = '';

  onMount(() => {
    if (thisModal && user) {
      copyText =
        'Name: ' +
        user.name +
        '\n' +
        'Password: ' +
        password +
        '\n' +
        'Secret URL: ' +
        urlJoin($page.url.origin, config.PATH.creator, user.secret || '');
    }
  });
</script>

{#if thisModal && user}
  <div class="w-modal rounded bg-surface-900 p-4">
    <div class="flex place-content-center">
      <Icon icon="mdi:check-circle" class="text-success-500" />
      <span class="ml-2">Secret created successfully</span>
    </div>

    <h3 class="my-6 text-center text-lg font-bold">{user.name}</h3>
    <div class="flex w-full place-content-center">
      <CopyText copyValue={copyText}>
        <div slot="hoverText">Click to copy to clipboard</div>

        <div class="text-center">
          Password:
          <div class="text-center text-lg font-bold">{password}</div>
        </div>
        <div class="mt-4 text-center">
          Secret URL:
          <div class="text-center text-sm font-bold">
            <a
              href={urlJoin(
                $page.url.origin,
                config.PATH.creator,
                user.secret || ''
              )}
              target="_blank"
              class="link"
            >
              {urlJoin(
                $page.url.origin,
                config.PATH.creator,
                user.secret || ''
              )}</a
            >
          </div>
        </div>

        <div class="m-auto pt-6 text-center">
          <span class="font-bold"> Share </span> this information only with your
          Creator
        </div>
      </CopyText>
    </div>
    <div class="mt-6 flex w-full place-content-center">
      <button
        class="variant-filled-secondary btn"
        on:click={() => parent.onClose()}>Close</button
      >
    </div>
  </div>
{/if}
