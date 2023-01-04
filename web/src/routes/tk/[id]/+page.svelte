<script lang="ts">
  import { applyAction } from '$app/forms';
  import { page } from '$app/stores';

  import {
    publicTicketDB,
    type PublicTicketDBType,
  } from '$lib/ORM/dbs/publicTicketDB';
  import type { ShowDocType } from '$lib/ORM/models/show';
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

  const onSubmit = ({ form }) => {
    waiting4StateChange = true;
    return async ({ result }) => {
      if (result.type !== 'success') {
        waiting4StateChange = false;
      } else {
        if (form) form.reset();
      }
      await applyAction(result);
    };
  };

  onMount(async () => {
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
    {#key ticket}
      <div class="pb-4 text-center">
        <TicketDetail {ticket} {show} />
      </div>
    {/key}
  </div>
</div>
