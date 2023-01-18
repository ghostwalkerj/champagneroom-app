<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';

  import { ticketDB } from '$lib/ORM/dbs/ticketDB';
  import type { ShowDocType, ShowDocument } from '$lib/ORM/models/show';
  import {
    type TicketDocType,
    TicketStatus,
    type TicketDocument,
  } from '$lib/ORM/models/ticket';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import TicketDetail from './TicketDetail.svelte';

  export let data: PageData;
  const token = data.token;
  let ticket = data.ticket as TicketDocument | null;
  let show = data.show as ShowDocument | null;
  let ticketId = $page.params.id;

  $: waiting4StateChange = false;
  $: canBuyTicket = true;

  const onSubmit = () => {
    waiting4StateChange = true;
    return async ({ result }) => {
      if (result.type === 'failure') {
        waiting4StateChange = false;
      }
      await applyAction(result);
    };
  };

  onMount(async () => {
    const db = await ticketDB(token, ticketId);
    show = await db.shows.findOne(show?._id).exec();
    ticket = await db.tickets.findOne(ticketId).exec();
    if (ticket) {
      ticket.$.subscribe(_ticket => {
        waiting4StateChange = false;
        canBuyTicket = _ticket.ticketState.status === TicketStatus.RESERVED;
      });
    }
  });
</script>

<div class="mt-6 flex items-center">
  <div class="min-w-full">
    <!-- Page header -->
    {#key ticket || show}
      <div class="pb-4 text-center">
        <TicketDetail {ticket} {show} />
      </div>
      {#if canBuyTicket}
        <form method="post" action="?/buy_ticket" use:enhance={onSubmit}>
          <div class="w-full flex justify-center">
            <button class="btn" type="submit">Send Payment</button>
          </div>
        </form>
      {/if}
    {/key}
  </div>
</div>
