<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_JITSI_DOMAIN, PUBLIC_TALENT_PATH } from '$env/static/public';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import type { TalentDocType } from '$lib/ORM/models/talent';
  import { browserType } from '$lib/stores';
  import {
    jitsiConfigOverwrite,
    jitsiInterfaceConfigOverwrite,
  } from '$lib/util/constants';
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';
  import type { PageData } from '../$types';
  export let data: PageData;

  let talentObj = data.talent as TalentDocType;
  $: currentShow = data.currentShow as ShowDocument | null;

  let videoCallElement: HTMLDivElement;
  let returnUrl = urlJoin($page.url.origin, PUBLIC_TALENT_PATH, talentObj.key);

  onMount(() => {
    const options = {
      roomName: currentShow?.roomId,
      width: '100%',
      height: '100%',
      parentNode: videoCallElement,
      userInfo: {
        displayName: talentObj.name,
      },
      configOverwrite: jitsiConfigOverwrite,
      interfaceConfigOverwrite: jitsiInterfaceConfigOverwrite,
    };
    const api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
    api.executeCommand('subject', currentShow?.name);
    api.executeCommand('avatarUrl', talentObj.profileImageUrl);
    api.addListener('readyToClose', () => {
      goto(returnUrl);
    });
    browserType.subscribe(browserType => {
      if (browserType === 'mobile' || browserType === 'tablet') {
        api.executeCommand('subject', currentShow?.name);
      }
    });
  });
</script>

<div
  bind:this={videoCallElement}
  class="w-screen  h-[calc(100vh-50px)] fixed top-0 left-0 right-0"
/>
