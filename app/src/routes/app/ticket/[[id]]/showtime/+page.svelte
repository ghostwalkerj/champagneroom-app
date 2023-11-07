<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

  import { ShowStatus, type ShowDocumentType } from '$lib/models/show';
  import type { UserDocument } from '$lib/models/user';

  import Config from '$lib/config';
  import { jitsiInterfaceConfigOverwrite } from '$lib/constants';
  import { notifyUpdate } from '$lib/notify';
  import getProfileImage from '$lib/profilePhoto';

  import type { PageData } from './$types';

  export let data: PageData;

  let show = data.show as ShowDocumentType;
  let user = data.user as UserDocument;

  // @ts-ignore
  let jitsiToken = data.jitsiToken as string;
  let showUnSub: Unsubscriber;

  let returnUrl = $page.params.returnUrl;
  let videoCallElement: HTMLDivElement;

  $: isTimeToLeave = false;

  if (browser) {
    onDestroy(() => {
      leaveShow();
      showUnSub?.();
    });

    const leaveShow = () => {
      let formData = new FormData();
      fetch($page.url.href + '?/leave_show', {
        method: 'POST',
        body: formData
      });
    };
  }

  const profileImage = getProfileImage(user.name, Config.UI.profileImagePath);
  onMount(() => {
    const options = {
      roomName: show.roomId,
      jwt: jitsiToken,
      width: '100%',
      height: '100%',
      parentNode: videoCallElement,
      userInfo: {
        displayName: user.name
      },
      interfaceConfigOverwrite: jitsiInterfaceConfigOverwrite,
      configOverwrite: {
        localSubject: show.name
      }
    };

    // @ts-ignore
    const api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
    api.executeCommand('avatarUrl', profileImage);

    api.addListener('toolbarButtonClicked', (event: any) => {
      if (event?.key === 'leave-show') {
        goto(returnUrl);
      }
    });

    showUnSub = notifyUpdate({
      id: show._id.toString(),
      type: 'Show',
      callback: () => {
        show = $page.data.show;
        isTimeToLeave =
          show.showState.status !== ShowStatus.LIVE &&
          show.showState.status !== ShowStatus.STOPPED;
        if (isTimeToLeave) {
          api.executeCommand('hangup');
          goto(returnUrl);
        }
      }
    });
  });
</script>

<div
  class="rounded-xl h-[calc(100vh-12px)] w-[calc(100vw-8px)] fixed top-0.5 m-1 overflow-hidden z-10"
>
  <div bind:this={videoCallElement} class="h-full" />
</div>
