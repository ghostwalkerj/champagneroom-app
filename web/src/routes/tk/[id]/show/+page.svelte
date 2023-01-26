<script lang="ts">
  import { PUBLIC_JITSI_DOMAIN } from '$env/static/public';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import type { TicketDocument } from '$lib/ORM/models/ticket';
  import {
    jitsiConfigOverwrite,
    jitsiInterfaceConfigOverwrite,
  } from '$lib/util/constants';
  import { onMount } from 'svelte';
  import type { PageData } from '../$types';

  let videoCallElement: HTMLDivElement;

  export let data: PageData;

  let ticket = data.ticket as TicketDocument;
  let show = data.show as ShowDocument;

  onMount(() => {
    const options = {
      roomName: show.name,
      width: 800,
      height: 800,
      parentNode: videoCallElement,
      userInfo: {
        displayName: ticket.ticketState.reservation.name,
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
