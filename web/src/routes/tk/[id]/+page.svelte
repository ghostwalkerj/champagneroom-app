<script lang="ts">
  import { applyAction } from '$app/forms';
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
  import type { TicketDocument } from '$lib/ORM/models/ticket';
  import { StorageTypes } from '$lib/ORM/rxdb';
  import { onMount } from 'svelte';
  import type { ActionData, PageData } from './$types';
  import TicketDetail from './TicketDetail.svelte';

  export let data: PageData;
  export let form: ActionData;
  const token = data.token;
  let ticket = data.ticket;
  let show = data.show as ShowDocType;
  let ticketId = $page.params.id;

  $: waiting4StateChange = false;

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
    {/key}
  </div>
</div>
