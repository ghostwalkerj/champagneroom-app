<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_JITSI_DOMAIN, PUBLIC_TALENT_PATH } from '$env/static/public';

  import { browser } from '$app/environment';
  import { jitsiInterfaceConfigOverwrite } from '$lib/constants';
  import type { ShowDocType } from '$lib/models/show';
  import type { TalentDocType } from '$lib/models/talent';
  import { onDestroy, onMount } from 'svelte';
  import urlJoin from 'url-join';
  import type { PageData } from './$types';
  export let data: PageData;

  let talentObj = data.talent as TalentDocType;
  $: currentShow = data.show as ShowDocType;
  let jitsiToken = data.jitsiToken;

  let videoCallElement: HTMLDivElement;
  let returnUrl = urlJoin($page.url.origin, PUBLIC_TALENT_PATH, talentObj.key);
  let api: any;
  let participantName = '';
  let participantAvatarUrl = '';

  if (browser) {
    onDestroy(() => {
      endShow();
    });

    const endShow = async () => {
      let formData = new FormData();
      formData.append('showId', currentShow?._id.toString());
      fetch($page.url.href + '?/end_show', {
        method: 'POST',
        body: formData,
      });
      api?.executeCommand('endConference');
    };
  }

  onMount(() => {
    const options = {
      roomName: currentShow?.roomId,
      jwt: jitsiToken,
      width: '100%',
      height: '100%',
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

    const participantJoined = (event: any) => {
      console.log('participantJoined', event);
      const numberOfParticipants = api.getNumberOfParticipants();
      console.log('numberOfParticipants', numberOfParticipants);
      api.getRoomsInfo().then(rooms => {
        console.log('rooms', rooms);
      });
    };

    const participantKnocked = (participant: any) => {
      participantName = participant?.displayName;
      participantAvatarUrl = participant?.avatarURL;
      console.log('participantName', participantName);
    };

    const answerKnock = (id: string, approved: boolean) => {
      console.log('answerKnock', id, approved);
    };

    // @ts-ignore
    api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
    api.executeCommand('avatarUrl', talentObj.profileImageUrl);
    api.executeCommand('subject', currentShow?.name);
    api.addListener('participantJoined', participantJoined);
    api.addListener('knockingParticipant', participantKnocked);
    api.addListener('readyToClose', () => {
      goto(returnUrl);
    });
  });
</script>

<div
  class="rounded-xl h-[calc(100vh-12px)] w-[calc(100vw-8px)] fixed top-0.5 m-1 overflow-hidden"
>
  <div bind:this="{videoCallElement}" class="h-full"></div>
</div>
