<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_JITSI_DOMAIN, PUBLIC_TALENT_PATH } from '$env/static/public';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import type { TalentDocType } from '$lib/ORM/models/talent';
  import { jitsiInterfaceConfigOverwrite } from '$lib/util/constants';
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';
  import type { PageData } from '../$types';
  export let data: PageData;

  let talentObj = data.talent as TalentDocType;
  $: currentShow = data.currentShow as ShowDocument | null;
  let jitsiToken = data.jitsiToken as string;

  let videoCallElement: HTMLDivElement;
  let returnUrl = urlJoin($page.url.origin, PUBLIC_TALENT_PATH, talentObj.key);
  let api: any;

  const participantJoined = (event: any) => {
    console.log('participantJoined', event);
    const numberOfParticipants = api.getNumberOfParticipants();
    console.log('numberOfParticipants', numberOfParticipants);
    api.getRoomsInfo().then(rooms => {
      console.log('rooms', rooms);
    });
  };

  onMount(() => {
    const options = {
      roomName: currentShow?.roomId,
      jwt: jitsiToken,
      width: '100%',
      height: '99%',
      parentNode: videoCallElement,
      userInfo: {
        displayName: talentObj.name,
      },
      interfaceConfigOverwrite: jitsiInterfaceConfigOverwrite,
      configOverwrite: {
        localSubject: currentShow?.name,
        filmstrip: {
          enabled: false,
        },
      },
    };

    // @ts-ignore
    api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
    api.executeCommand('avatarUrl', talentObj.profileImageUrl);
    api.executeCommand('subject', currentShow?.name);
    api.addListener('participantJoined', participantJoined);
    api.addListener('readyToClose', () => {
      goto(returnUrl);
    });
  });
</script>

<div
  bind:this={videoCallElement}
  class="w-screen  h-full fixed top-0 left-0 right-0"
/>
