<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import { ticketDB } from '$lib/ORM/dbs/ticketDB';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import { type TicketDocument, TicketStatus } from '$lib/ORM/models/ticket';

  import { onMount } from 'svelte';
  import urlJoin from 'url-join';
  import type { PageData } from './$types';
  import TicketDetail from './TicketDetail.svelte';

  export let data: PageData;
  const token = data.token;
  let ticket = data.ticket as TicketDocument | null;
  let show = data.show as ShowDocument | null;
  let ticketId = $page.params.id;

  const showPath = urlJoin($page.url.href, 'show');

  $: waiting4StateChange = false;
  $: needs2Pay =
    ticket &&
    ticket.ticketState.status === TicketStatus.RESERVED &&
    ticket.ticketState.totalPaid < ticket.ticketState.price;

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
        ticket = _ticket;
        needs2Pay =
          _ticket.ticketState.status === TicketStatus.RESERVED &&
          _ticket.ticketState.totalPaid < _ticket.ticketState.price;
      });
    }
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
                <button class="btn" type="submit">Send Payment</button>
              </div>
            </form>
          </div>
        {/if}
        {#if ticket.ticketState.totalPaid - ticket.ticketState.refundedAmount >= ticket.ticketState.price}
          <div class="p-4">
            <div class="w-full flex justify-center">
              <button
                class="btn"
                on:click={() => {
                  goto(showPath);
                }}>Go to the Show</button
              >
            </div>
          </div>
        {:else if ticket.ticketState.status !== TicketStatus.CANCELLED && ticket.ticketState.status !== TicketStatus.CANCELLATION_REQUESTED}
          <div class="p-4">
            <form method="post" action="?/cancel_ticket" use:enhance>
              <div class="w-full flex justify-center">
                <button class="btn" type="submit">Cancel Ticket</button>
              </div>
            </form>
          </div>
        {/if}
      {/key}
    </div>
  </div>
{/if}
