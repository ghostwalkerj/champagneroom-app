<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { goto } from '$app/navigation';
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

  import { type ShowDocumentType, ShowStatus } from '$lib/models/show';
  import type { UserDocument } from '$lib/models/user';

  import Config from '$lib/config';
  import { jitsiInterfaceConfigOverwrite } from '$lib/constants';
  import getProfileImage from '$lib/profilePhoto';

  import { showStore } from '$stores';

  import type { PageData } from './$types';

  export let data: PageData;

  let show = data.show as ShowDocumentType;
  let user = data.user as UserDocument;
  const returnPath = Config.Path.ticket;

  // @ts-ignore
  let jitsiToken = data.jitsiToken as string;
  let showUnSub: Unsubscriber;

  let videoCallElement: HTMLDivElement;

  let hasLeftShow = false;
  let api: any;

  const profileImage = getProfileImage(user.name, Config.UI.profileImagePath);

  const postLeaveShow = async () => {
    if (hasLeftShow) return;
    hasLeftShow = true;

    let formData = new FormData();
    await fetch('?/leave_show', {
      method: 'POST',
      body: formData
    });
    videoCallElement?.remove();
    api?.executeCommand('hangup');
    api?.dispose();

    showUnSub?.();
    goto(returnPath).then(() => {
      // window.location.reload();
    });
  };
  onDestroy(() => {
    postLeaveShow();
  });

  onMount(async () => {
    const isTimeToLeave =
      show.showState.status !== ShowStatus.LIVE &&
      show.showState.status !== ShowStatus.STOPPED;
    if (isTimeToLeave) {
      await postLeaveShow();
    }

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
        filmstrip: {
          enabled: false
        },
        disabledNotifications: ['dialog.sessTerminated'],
        localSubject: show?.name
      }
    };

    // @ts-ignore
    api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
    api.executeCommand('avatarUrl', profileImage);

    api.addListener('toolbarButtonClicked', async (event: any) => {
      if (event?.key === 'leave-show') {
        //api.executeCommand('hangup');
        await postLeaveShow();
      }
    });

    api.addListener('videoConferenceLeft', () => {
      postLeaveShow();
    });

    showUnSub?.();
    showUnSub = showStore(show).subscribe(async (_show) => {
      if (!_show) return;
      show = _show;
      const isTimeToLeave =
        show.showState.status !== ShowStatus.LIVE &&
        show.showState.status !== ShowStatus.STOPPED;
      if (isTimeToLeave) {
        await postLeaveShow();
      }
    });
  });
</script>

<div
  class="rounded-xl h-[calc(100vh-12px)] w-[calc(100vw-8px)] fixed top-0.5 m-1 overflow-hidden z-10"
>
  <div bind:this={videoCallElement} class="h-full" />
</div>
