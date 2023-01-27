<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_JITSI_DOMAIN, PUBLIC_SHOW_PATH } from '$env/static/public';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import type { TicketDocument } from '$lib/ORM/models/ticket';
  import {
    jitsiConfigOverwrite,
    jitsiInterfaceConfigOverwrite,
  } from '$lib/util/constants';
  import getProfileImage from '$lib/util/profilePhoto';
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';
  import type { PageData } from '../$types';

  export let data: PageData;

  let ticket = data.ticket as TicketDocument;
  let show = data.show as ShowDocument;

  let returnUrl = urlJoin($page.url.origin, PUBLIC_SHOW_PATH, show._id);
  let videoCallElement: HTMLDivElement;

  const profileImage = urlJoin(
    $page.url.origin,
    getProfileImage(ticket.ticketState.reservation.name)
  );

  onMount(() => {
    const options = {
      roomName: show.roomId,
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
    api.executeCommand('avatarUrl', profileImage);

    api.addListener('readyToClose', () => {
      goto(returnUrl);
    });
  });
</script>

<div class="w-screen flex justify-center">
  <div bind:this={videoCallElement} />
</div>
