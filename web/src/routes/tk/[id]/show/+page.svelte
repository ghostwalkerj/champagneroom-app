<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { PUBLIC_JITSI_DOMAIN, PUBLIC_TICKET_PATH } from '$env/static/public';
  import { createTicketMachineService } from '$lib/machines/ticketMachine';
  import { ticketDB, type TicketDBType } from '$lib/ORM/dbs/ticketDB';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import type { TicketDocument } from '$lib/ORM/models/ticket';
  import { jitsiInterfaceConfigOverwrite } from '$lib/util/constants';
  import getProfileImage from '$lib/util/profilePhoto';
  import { onDestroy, onMount } from 'svelte';
  import urlJoin from 'url-join';
  import type { PageData } from '../$types';

  export let data: PageData;

  let ticket = data.ticket as TicketDocument;
  let show = data.show as ShowDocument;
  const ticketId = $page.params.id;
  const token = data.token;

  // @ts-ignore
  let jitsiToken = data.jitsiToken as string;

  let returnUrl = urlJoin($page.url.origin, PUBLIC_TICKET_PATH, ticket._id);
  let videoCallElement: HTMLDivElement;

  onDestroy(() => {
    endShow();
  });

  const endShow = () => {
    let formData = new FormData();
    fetch($page.url.href + '?/leave_show', {
      method: 'POST',
      body: formData,
    });
  };

  const profileImage = urlJoin(
    $page.url.origin,
    getProfileImage(ticket.ticketState.reservation.name)
  );

  onMount(() => {
    const options = {
      roomName: show.roomId,
      jwt: jitsiToken,
      width: '100%',
      height: '100%',
      parentNode: videoCallElement,
      userInfo: {
        displayName: ticket.ticketState.reservation.name,
      },
      interfaceConfigOverwrite: jitsiInterfaceConfigOverwrite,
      configOverwrite: {
        localSubject: show.name,
      },
    };

    // @ts-ignore
    const api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
    api.executeCommand('avatarUrl', profileImage);
    api.addListener('readyToClose', () => {
      goto(returnUrl);
    });

    ticketDB(ticket._id, token).then(async (db: TicketDBType) => {
      show = (await db.shows.findOne(show._id).exec()) as ShowDocument;
      ticket = (await db.tickets.findOne(ticket._id).exec()) as TicketDocument;
      const ticketMachineService = createTicketMachineService({
        ticketDocument: ticket,
        showDocument: show,
        saveState: false,
        observeState: true,
      });

      ticketMachineService.subscribe(state => {
        const timeToLeave = !state.can({
          type: 'JOINED SHOW',
        });
        if (timeToLeave) {
          api.executeCommand('hangup');
          goto(returnUrl);
        }
      });
    });
  });
</script>

<div
  class="rounded-xl h-[calc(100vh-12px)] w-[calc(100vw-8px)] fixed top-0.5 m-1 overflow-hidden"
>
  <div bind:this={videoCallElement} class="h-full" />
</div>
