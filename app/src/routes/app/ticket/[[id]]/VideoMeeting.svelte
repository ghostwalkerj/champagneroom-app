<script lang="ts">
  import { onMount, tick } from 'svelte';

  import { browser } from '$app/environment';
  import { onNavigate } from '$app/navigation';
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

  import type { ShowDocumentType } from '$lib/models/show';
  import type { UserDocumentType } from '$lib/models/user';

  import { jitsiInterfaceConfigOverwrite } from '$lib/constants';

  export let jitsiToken: string;
  export let leftShowCallback: () => void;
  export let show: ShowDocumentType;
  export let user: UserDocumentType;

  // @ts-ignore
  let videoCallElement: HTMLDivElement;

  let hasLeftShow = false;
  let api: any;

  const postLeaveShow = async () => {
    leftShowCallback?.();
    if (hasLeftShow || !browser) return;
    hasLeftShow = true;
    videoCallElement?.remove();
    api?.executeCommand('hangup');
    api?.dispose();
    leftShowCallback?.();
  };

  onMount(async () => {
    const options = {
      roomName: show.conferenceKey,
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
    api.executeCommand('avatarUrl', user.profileImageUrl);

    api.addListener('toolbarButtonClicked', async (event: any) => {
      if (event?.key === 'leave-show') {
        //api.executeCommand('hangup');
        await postLeaveShow();
      }
    });

    api.addListener('videoConferenceLeft', () => {
      postLeaveShow();
    });

    api.addListener('participantLeft', (event: any) => {
      api.isP2pActive().then((isP2p: boolean) => {
        if (!isP2p) {
          postLeaveShow();
        }
      });
    });

    onNavigate(async () => {
      await tick();
      postLeaveShow();
    });
  });
</script>

<div class="fixed top-0 z-20 h-screen w-screen">
  <div bind:this={videoCallElement} class="h-screen" />
</div>
