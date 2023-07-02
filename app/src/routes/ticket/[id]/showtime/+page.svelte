<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import type { Unsubscriber } from 'svelte/store';
  import urlJoin from 'url-join';

  import { browser } from '$app/environment';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import {
    PUBLIC_JITSI_DOMAIN,
    PUBLIC_PROFILE_IMAGE_PATH,
    PUBLIC_TICKET_PATH
  } from '$env/static/public';

  import { type ShowDocumentType, ShowStatus } from '$lib/models/show';
  import type { TicketDocumentType } from '$lib/models/ticket';

  import { jitsiInterfaceConfigOverwrite } from '$lib/constants';
  import getProfileImage from '$lib/util/profilePhoto';

  import { showStore } from '$stores';

  import type { PageData } from './$types';

  export let data: PageData;

  let ticket = data.ticket as TicketDocumentType;
  let show = data.show as ShowDocumentType;

  // @ts-ignore
  let jitsiToken = data.jitsiToken as string;
  let showUnSub: Unsubscriber;

  let returnUrl = urlJoin(
    $page.url.origin,
    PUBLIC_TICKET_PATH,
    ticket._id.toString()
  );
  let videoCallElement: HTMLDivElement;

  if (browser) {
    onDestroy(() => {
      leaveShow();
      showUnSub?.();
    });

    const leaveShow = () => {
      let formData = new FormData();
      fetch($page.url.href + '?/leave_show', {
        method: 'POST',
        body: formData
      });
    };
  }

  const profileImage = urlJoin(
    $page.url.origin,
    getProfileImage(ticket.customerName, PUBLIC_PROFILE_IMAGE_PATH)
  );
  onMount(() => {
    const options = {
      roomName: show.roomId,
      jwt: jitsiToken,
      width: '100%',
      height: '100%',
      parentNode: videoCallElement,
      userInfo: {
        displayName: ticket.customerName
      },
      interfaceConfigOverwrite: jitsiInterfaceConfigOverwrite,
      configOverwrite: {
        localSubject: show.name
      }
    };

    // @ts-ignore
    const api = new JitsiMeetExternalAPI(PUBLIC_JITSI_DOMAIN, options);
    api.executeCommand('avatarUrl', profileImage);

    api.addListener('toolbarButtonClicked', (event: any) => {
      if (event?.key === 'leave-show') {
        goto(returnUrl);
      }
    });

    showUnSub = showStore(show).subscribe((_show) => {
      const isTimeToLeave =
        _show.showState.status !== ShowStatus.LIVE &&
        _show.showState.status !== ShowStatus.STOPPED;
      if (isTimeToLeave) {
        api.executeCommand('hangup');
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
