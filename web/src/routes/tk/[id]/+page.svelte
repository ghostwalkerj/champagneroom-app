<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { page } from '$app/stores';
  import {
    publicShowDB,
    type PublicShowDBType,
  } from '$lib/ORM/dbs/publicShowDB';

  import {
    publicTicketDB,
    type PublicTicketDBType,
  } from '$lib/ORM/dbs/publicTicketDB';
  import type { ShowDocType, ShowDocument } from '$lib/ORM/models/show';
  import { TicketStatus, type TicketDocument } from '$lib/ORM/models/ticket';
  import { StorageTypes } from '$lib/ORM/rxdb';
  import { onMount } from 'svelte';
  import type { PageData } from './$types';
  import TicketDetail from './TicketDetail.svelte';

  export let data: PageData;
  const token = data.token;
  let ticket = data.ticket;
  let show = data.show as ShowDocType;
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
    publicShowDB(token, show._id, StorageTypes.IDB).then(
      (db: PublicShowDBType) => {
        db.shows.findOne(show._id).$.subscribe(_show => {
          show = _show as ShowDocument;
        });
      }
    );
    publicTicketDB(token, ticketId, StorageTypes.IDB).then(
      (db: PublicTicketDBType) => {
        db.tickets.findOne(ticketId).$.subscribe(_ticket => {
          if (_ticket) {
            ticket = _ticket as TicketDocument;
            waiting4StateChange = false;
            canBuyTicket = ticket.ticketState.status === TicketStatus.RESERVED;
          }
        });
      }
    );
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
