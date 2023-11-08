<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';

  import type { CreatorDocumentType } from '$lib/models/creator';
  import type { ShowDocumentType } from '$lib/models/show';

  import { jitsiInterfaceConfigOverwrite } from '$lib/constants';

  import type { PageData } from './$types';

  export let data: PageData;

  let creator = data.creator as CreatorDocumentType;
  $: currentShow = data.show as ShowDocumentType;
  const returnPath = data.returnPath as string;
  let user = data.user;
  let jitsiToken = data.jitsiToken;

  let videoCallElement: HTMLDivElement;
  let api: any;
  let participantName = '';
  let isShowStopped = false;

  const stopShow = async () => {
    if (isShowStopped) return;
    let formData = new FormData();
    formData.append('showId', currentShow?._id.toString());
    fetch('?/stop_show', {
      method: 'POST',
      body: formData
    });
    isShowStopped = true;
    api?.executeCommand('endConference');
  };

  if (browser) {
    onDestroy(() => {
      stopShow();
    });
  }

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
    api.addListener('toolbarButtonClicked', (event: any) => {
      if (event?.key === 'leave-show') {
        stopShow();
        goto(returnPath);
      }
    });
  });
</script>

<div
  class="rounded-xl h-[calc(100vh-12px)] w-[calc(100vw-8px)] fixed top-0.5 m-1 overflow-hidden z-10"
>
  <div bind:this={videoCallElement} class="h-full" />
</div>
