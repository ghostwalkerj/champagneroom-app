<script lang="ts">
  import { addIcon } from 'iconify-icon';
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';

  import { beforeNavigate, goto } from '$app/navigation';
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

  import type { ShowDocumentType } from '$lib/models/show';
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

  $: isTimeToLeave = false;
  let hasLeftShow = false;

  const profileImage = getProfileImage(user.name, Config.UI.profileImagePath);
  onMount(() => {
    const postLeaveShow = async () => {
      if (hasLeftShow) return;
      let formData = new FormData();
      await fetch('?/leave_show', {
        method: 'POST',
        body: formData
      });
      hasLeftShow = true;
      goto(returnPath, { invalidateAll: true }).then(() => {
        videoCallElement?.remove();
        api.executeCommand('hangup');
        window.location.reload();
      });
    };
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
    const api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
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

    onDestroy(() => {
      postLeaveShow();
      showUnSub?.();
    });

    // isTimeToLeave =
    //   show.showState.status !== ShowStatus.LIVE &&
    //   show.showState.status !== ShowStatus.STOPPED;
    // if (isTimeToLeave) {
    //   api.executeCommand('hangup');
    //   leaveShow();
    //   goto(returnPath);
    // }
    showUnSub = showStore(show).subscribe((_show) => {
      show = _show;
      // isTimeToLeave =
      //   show.showState.status !== ShowStatus.LIVE &&
      //   show.showState.status !== ShowStatus.STOPPED;
      // if (isTimeToLeave) {
      //   api.executeCommand('hangup');
      //   leaveShow();
      //   goto(returnPath);
      // }
    });
  });
</script>

<div
  class="rounded-xl h-[calc(100vh-12px)] w-[calc(100vw-8px)] fixed top-0.5 m-1 overflow-hidden z-10"
>
  <div bind:this={videoCallElement} class="h-full" />
</div>
