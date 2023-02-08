<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import { ticketDB, TicketDBType } from '$lib/ORM/dbs/ticketDB';
  import { ShowStatus, type ShowDocument } from '$lib/ORM/models/show';
  import { TicketStatus, type TicketDocument } from '$lib/ORM/models/ticket';

  import urlJoin from 'url-join';
  import type { PageData } from './$types';
  import TicketDetail from './TicketDetail.svelte';

  export let data: PageData;
  const token = data.token;
  let ticket = data.ticket as TicketDocument;
  let show = data.show as ShowDocument;
  let ticketId = $page.params.id;

  const showPath = urlJoin($page.url.href, 'show');

  $: waiting4StateChange = false;
  $: needs2Pay = false;
  $: canWatchShow = false;
  $: showStarted = false;

  const onSubmit = ({}) => {
    waiting4StateChange = true;
    return async ({ result }) => {
      if (result.type !== 'success') {
        waiting4StateChange = false;
      }
      await applyAction(result);
    };
  };

  ticketDB(ticketId, token).then(async (db: TicketDBType) => {
    show = (await db.shows.findOne(show._id).exec()) as ShowDocument;
    ticket = (await db.tickets.findOne(ticketId).exec()) as TicketDocument;
    ticket.$.subscribe(_ticket => {
      waiting4StateChange = false;

      ticket = _ticket;
      needs2Pay =
        _ticket.ticketState.status === TicketStatus.RESERVED &&
        _ticket.ticketState.totalPaid < _ticket.ticketState.price;
      canWatchShow =
        _ticket.ticketState.totalPaid - _ticket.ticketState.refundedAmount >=
        _ticket.ticketState.price;
    });

    show.$.subscribe(_show => {
      show = _show;
      showStarted = _show.showState.status === ShowStatus.STARTED;
    });
  });
</script>

{#if ticket}
  <div class="mt-6 flex items-center">
    <div class="min-w-full ">
      <!-- Page header -->
      {#key ticket || show}
        <div class="pb-4 text-center">
          <TicketDetail {ticket} {show} />
        </div>
        {#if needs2Pay}
          <div>
            <form method="post" action="?/buy_ticket" use:enhance={onSubmit}>
              <div class="w-full flex justify-center">
                <button class="btn" type="submit" disabled={waiting4StateChange}
                  >Send Payment</button
                >
              </div>
            </form>
          </div>
        {/if}
        {#if canWatchShow && showStarted}
          <div class="p-4">
            <div class="w-full flex justify-center">
              <button
                class="btn"
                disabled={waiting4StateChange}
                on:click={() => {
                  goto(showPath);
                }}>Go to the Show</button
              >
            </div>
          </div>
        {:else if canWatchShow && !showStarted}
          <div class="p-4">
            <div class="w-full flex justify-center">
              <button class="btn" disabled={true}
                >Waiting for Show to Start</button
              >
            </div>
          </div>
        {:else if ticket.ticketState.status !== TicketStatus.CANCELLED && ticket.ticketState.status !== TicketStatus.CANCELLATION_REQUESTED}
          <div class="p-4">
            <form method="post" action="?/cancel_ticket" use:enhance>
              <div class="w-full flex justify-center">
                <button class="btn" type="submit" disabled={waiting4StateChange}
                  >Cancel Ticket</button
                >
              </div>
            </form>
          </div>
        {/if}
      {/key}
    </div>
  </div>
{/if}
