<script lang="ts">
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import type { TalentDocType } from '$lib/ORM/models/talent';
  import {
    jitsiConfigOverwrite,
    jitsiInterfaceConfigOverwrite,
  } from '$lib/util/constants';
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
      configOverwrite: jitsiConfigOverwrite,
      interfaceConfigOverwrite: jitsiInterfaceConfigOverwrite,
    };
    const api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
  });
</script>

<div class="w-screen flex justify-center">
  <div bind:this={videoCallElement} />
</div>
