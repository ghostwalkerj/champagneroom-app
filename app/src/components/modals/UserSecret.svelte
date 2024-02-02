<script lang="ts">
  import { page } from '$app/stores';
  import CopyText from '$components/CopyText.svelte';
  import config from '$lib/config';
  import Icon from '@iconify/svelte';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import { onMount, type SvelteComponent } from 'svelte';
  import urlJoin from 'url-join';

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
  <div class="w-modal bg-surface-900 p-4 rounded">
    <div class="flex place-content-center">
      <Icon icon="mdi:check-circle" class="text-success" />
      <span class="ml-2">Updated successfully</span>
    </div>

    <h3 class="font-bold text-lg text-center my-6">{user.name}</h3>
    <div class="w-full flex place-content-center">
      <CopyText copyValue={copyText}>
        <div class="text-center">
          Password:
          <div class="text-center font-bold text-lg">{password}</div>
        </div>
        <div class="text-center mt-4">
          Secret URL:
          <div class="text-center font-bold text-sm">
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

        <div class="text-center m-auto pt-6">
          <span class="font-bold"> Share </span> this information only with your
          Creator
        </div>
      </CopyText>
    </div>
    <div class="flex place-content-end w-full">
      <button
        class="btn variant-filled-secondary"
        on:click={() => parent.onClose()}>Close</button
      >
    </div>
  </div>
{/if}
