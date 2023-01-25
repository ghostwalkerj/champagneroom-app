<script lang="ts">
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import type { TalentDocType } from '$lib/ORM/models/talent';
  import { onMount } from 'svelte';
  import type { PageData } from '../$types';

  let videoCallElement: HTMLDivElement;

  export let data: PageData;

  let talentObj = data.talent as TalentDocType;
  $: currentShow = data.currentShow as ShowDocument | null;

  onMount(() => {
    const options = {
      roomName: currentShow?.name,
      width: 800,
      height: 800,
      parentNode: videoCallElement,
      userInfo: {
        displayName: talentObj.name,
      },
      configOverwrite: {
        prejoinPageEnabled: false,
      },
      interfaceConfigOverwrite: {
        TOOLBAR_BUTTONS: [
          'microphone',
          'camera',
          'fullscreen',
          'fodeviceselection',
          'hangup',
          'tileview',
        ],
      },
    };

    const api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
  });
</script>

<div class="w-screen flex justify-center">
  <div bind:this={videoCallElement} />
</div>
