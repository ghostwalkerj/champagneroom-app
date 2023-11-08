<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';

  import type { TicketDocument } from '$lib/models/ticket';
  import { type UserDocument, UserRole } from '$lib/models/user';

  import Config from '$lib/config';

  import type { PageData } from './$types';
  export let data: PageData;

  onMount(() => {
    const user = data.user as UserDocument;
    const ticket = data.ticket as TicketDocument;

    if (user.roles.includes(UserRole.OPERATOR)) {
      goto(Config.Path.operator);
    } else if (user.roles.includes(UserRole.AGENT)) {
      goto(Config.Path.agent);
    } else if (user.roles.includes(UserRole.CREATOR)) {
      goto(Config.Path.creator);
    } else if (user.roles.includes(UserRole.TICKET_HOLDER) && ticket) {
      goto(urlJoin(Config.Path.ticket, ticket._id.toString()));
    } else {
      goto(Config.Path.websiteUrl);
    }
  });
</script>
