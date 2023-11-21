<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

  import type { CreatorDocumentType } from '$lib/models/creator';
  import type { ShowDocumentType } from '$lib/models/show';

  import Config from '$lib/config';
  import { jitsiInterfaceConfigOverwrite } from '$lib/constants';

  import type { PageData } from './$types';

  export let data: PageData;

  let creator = data.creator as CreatorDocumentType;
  $: currentShow = data.show as ShowDocumentType;
  let user = data.user;
  let jitsiToken = data.jitsiToken;

  const returnPath = Config.Path.creator;
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

    let formData = new FormData();
    await fetch('?/leave_show', {
      method: 'POST',
      body: formData
    });
    api?.dispose();
    videoCallElement?.remove();

    goto(returnPath, {
      invalidateAll: true
    }).then(() => {
      //window.location.reload();
    });
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

<div
  class="rounded-xl h-[calc(100vh-12px)] w-[calc(100vw-8px)] fixed top-0.5 m-1 overflow-hidden z-10"
>
  <div bind:this={videoCallElement} class="h-full" />
</div>
