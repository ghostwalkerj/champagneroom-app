<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import { browser } from '$app/environment';
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

  import type { CreatorDocumentType } from '$lib/models/creator';
  import type { ShowDocumentType } from '$lib/models/show';

  import { jitsiInterfaceConfigOverwrite } from '$lib/constants';

  import type { UserDocumentType } from '$lib/models/user';

  export let creator: CreatorDocumentType;
  export let currentShow: ShowDocumentType;
  export let user: UserDocumentType;
  export let jitsiToken: string;
  export let leftShowCallback: () => void;

  let videoCallElement: HTMLDivElement;
  let api: any;
  let participantName = '';
  let hasLeftShow = false;

  const participantJoined = (event: any) => {
    console.log('participantJoined', event);
    const numberOfParticipants = api.getNumberOfParticipants();
    console.log('numberOfParticipants', numberOfParticipants);
    api.getRoomsInfo().then((rooms: any) => {
      console.log('rooms', rooms);
    });
  };

  const participantKnocked = (participant: any) => {
    participantName = participant?.displayName;
    console.log('participantName', participantName);
  };

  const postLeaveShow = async () => {
    if (hasLeftShow || !browser) return;
    hasLeftShow = true;
    api?.executeCommand('endConference');
    api?.executeCommand('hangup');

    let formData = new FormData();
    await fetch('?/leave_show', {
      method: 'POST',
      body: formData
    });

    api?.dispose();
    videoCallElement?.remove();
    leftShowCallback?.();
  };

  onDestroy(() => {
    postLeaveShow();
  });

  onMount(() => {
    const options = {
      roomName: currentShow?.roomId,
      jwt: jitsiToken,
      width: '100%',
      height: '100%',
      parentNode: videoCallElement,
      userInfo: {
        displayName: user.name
      },
      interfaceConfigOverwrite: jitsiInterfaceConfigOverwrite,
      configOverwrite: {
        localSubject: currentShow?.name,
        filmstrip: {
          enabled: false
        },
        disabledNotifications: ['dialog.sessTerminated']
      }
    };

    // @ts-ignore
    api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
    api.executeCommand('avatarUrl', creator.profileImageUrl);
    api.executeCommand('subject', currentShow?.name);
    api.addListener('participantJoined', participantJoined);
    api.addListener('knockingParticipant', participantKnocked);
    api.addListener('toolbarButtonClicked', async (event: any) => {
      if (event?.key === 'leave-show') {
        await postLeaveShow();
      }
    });

    api.addListener('videoConferenceLeft', () => {
      postLeaveShow();
    });
  });
</script>

<div class="fixed top-0 h-screen w-screen z-20">
  <div bind:this={videoCallElement} class="h-screen" />
</div>
