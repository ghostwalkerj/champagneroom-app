<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_JITSI_DOMAIN, PUBLIC_TALENT_PATH } from '$env/static/public';

  import type { ShowDocumentType } from '$lib/models/show';
  import type { TalentDocumentType } from '$lib/models/talent';

  import { jitsiInterfaceConfigOverwrite } from '$lib/constants';

  import type { PageData } from './$types';

  export let data: PageData;

  let talentObject = data.talent as TalentDocumentType;
  $: currentShow = data.show as ShowDocumentType;
  let jitsiToken = data.jitsiToken;

  let videoCallElement: HTMLDivElement;
  let returnUrl = urlJoin(
    $page.url.origin,
    PUBLIC_TALENT_PATH,
    talentObject.user.address
  );
  let api: any;
  let participantName = '';

  const stopShow = async () => {
    let formData = new FormData();
    formData.append('showId', currentShow?._id.toString());
    fetch($page.url.href + '?/stop_show', {
      method: 'POST',
      body: formData
    });
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
        displayName: talentObject.user.name
      },
      interfaceConfigOverwrite: jitsiInterfaceConfigOverwrite,
      configOverwrite: {
        localSubject: currentShow?.name,
        filmstrip: {
          enabled: false
        }
      }
    };

    // @ts-ignore
    api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
    api.executeCommand('avatarUrl', talentObject.profileImageUrl);
    api.executeCommand('subject', currentShow?.name);
    api.addListener('participantJoined', participantJoined);
    api.addListener('knockingParticipant', participantKnocked);
    api.addListener('toolbarButtonClicked', (event: any) => {
      if (event?.key === 'leave-show') {
        stopShow();
        goto(returnUrl);
      }
    });
  });
</script>

<div
  class="rounded-xl h-[calc(100vh-12px)] w-[calc(100vw-8px)] fixed top-0.5 m-1 overflow-hidden z-10"
>
  <div bind:this={videoCallElement} class="h-full" />
</div>
