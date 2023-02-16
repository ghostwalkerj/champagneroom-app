<script lang="ts">
  import { applyAction, enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { createTicketMachineService } from '$lib/machines/ticketMachine';

  import { ticketDB, type TicketDBType } from '$lib/ORM/dbs/ticketDB';
  import type { ShowDocument } from '$lib/ORM/models/show';
  import type { TicketDocument } from '$lib/ORM/models/ticket';
  import { onMount } from 'svelte';

  import urlJoin from 'url-join';
  import type { PageData } from './$types';
  import TicketDetail from './TicketDetail.svelte';

  export let data: PageData;
  const token = data.token;
  let ticket = data.ticket as TicketDocument;
  let show = data.show as ShowDocument;
  let ticketId = $page.params.id;

  const showPath = urlJoin($page.url.href, 'show');
  let ticketMachineService = createTicketMachineService({
    ticketDocument: ticket,
    showDocument: show,
    saveState: false,
    observeState: false,
  });

  let needs2Pay = false;
  let canWatchShow = false;
  let canCancelTicket = false;
  let ticketDone = false;

  $: ticketMachineService.subscribe(state => {
    needs2Pay = state.matches('reserved.waiting4Payment');
    canWatchShow = state.can('WATCH SHOW');
    canCancelTicket = state.can({
      type: 'REQUEST CANCELLATION',
      cancel: undefined,
    });
    ticketDone = state.done ?? false;
  });

  $: waiting4StateChange = true;

  const onSubmit = () => {
    waiting4StateChange = true;
    return async ({ result }) => {
      if (result.type === 'failure') {
        waiting4StateChange = false;
      }
      await applyAction(result);
    };
  };

  if (ticket.ticketState.active) {
    ticketDB(ticketId, token).then(async (db: TicketDBType) => {
      show = (await db.shows.findOne(show._id).exec()) as ShowDocument;
      const _ticket = (await db.tickets
        .findOne(ticketId)
        .exec()) as TicketDocument;
      if (ticketMachineService) {
        ticketMachineService.stop();
      }
      _ticket.$.subscribe(newTicket => {
        ticket = newTicket;
        waiting4StateChange = false;
      });

      ticketMachineService = createTicketMachineService({
        ticketDocument: _ticket,
        showDocument: show,
        saveState: false,
        observeState: true,
      });
    });
  }

  onMount(() => {
    waiting4StateChange = false;
  });
</script>

{#if ticket}
  <div class="mt-6 flex items-center">
    <div class="min-w-full ">
      <!-- Page header -->
      <div class="pb-4 text-center">
        <TicketDetail {ticket} {show} />
      </div>
      {#if !ticketDone}
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
        {:else if canWatchShow}
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
        {:else}
          <div class="p-4">
            <div class="w-full flex justify-center">
              <button class="btn" disabled={true}
                >Waiting for Show to Start</button
              >
            </div>
          </div>
        {/if}
        {#if canCancelTicket}
          <div class="p-4">
            <form method="post" action="?/cancel_ticket" use:enhance={onSubmit}>
              <div class="w-full flex justify-center">
                <button class="btn" type="submit" disabled={waiting4StateChange}
                  >Cancel Ticket</button
                >
              </div>
            </form>
          </div>
        {/if}
      {/if}
    </div>
  </div>
{/if}
