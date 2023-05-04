<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    PUBLIC_JITSI_DOMAIN,
    PUBLIC_PROFILE_IMAGE_PATH,
    PUBLIC_RXDB_PASSWORD,
    PUBLIC_TICKET_DB_ENDPOINT,
    PUBLIC_TICKET_PATH,
  } from '$env/static/public';
  import { ticketDB, type TicketDBType } from 'pshared/src/ORM/dbs/ticketDB';
  import type { ShowDocument } from 'pshared/src/ORM/models/show';
  import type { TicketDocument } from 'pshared/src/ORM/models/ticket';
  import { type DatabaseOptions, StorageType } from 'pshared/src/ORM/rxdb';
  import { createTicketMachineService } from 'pshared/src/machines/ticketMachine';
  import { jitsiInterfaceConfigOverwrite } from 'pshared/src/util/constants';
  import getProfileImage from 'pshared/src/util/profilePhoto';
  import { onDestroy, onMount } from 'svelte';
  import urlJoin from 'url-join';
  import type { PageData } from '../$types';

  export let data: PageData;

  let ticket = data.ticket as TicketDocument;
  let show = data.show as ShowDocument;
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
    getProfileImage(
      ticket.ticketState.reservation.name,
      PUBLIC_PROFILE_IMAGE_PATH
    )
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

    const dbOptions = {
      endPoint: PUBLIC_TICKET_DB_ENDPOINT,
      storageType: StorageType.IDB,
      rxdbPassword: PUBLIC_RXDB_PASSWORD,
    } as DatabaseOptions;

    ticketDB(ticket._id, token, dbOptions).then(async (db: TicketDBType) => {
      show = (await db.shows.findOne(show._id).exec()) as ShowDocument;
      ticket = (await db.tickets.findOne(ticket._id).exec()) as TicketDocument;
      const ticketMachineService = createTicketMachineService(ticket, show, {
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
