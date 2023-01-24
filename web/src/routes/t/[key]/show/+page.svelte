<script lang="ts">
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import type { TalentDocType } from '$lib/ORM/models/talent';
  import { onMount } from 'svelte';
  import type { PageData } from '../$types';

  let videoCallElement: HTMLDivElement;
  let innerHeight = 0;
  let innerWidth = 0;
  export let data: PageData;

  const token = data.token;
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
        BRAND_WATERMARK_LINK: '',

        SHOW_JITSI_WATERMARK: false,
        HIDE_DEEP_LINKING_LOGO: true,
        SHOW_BRAND_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
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
