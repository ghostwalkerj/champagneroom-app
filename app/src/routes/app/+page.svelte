<script lang="ts">
  import { onMount } from 'svelte';
  import urlJoin from 'url-join';

  import { goto } from '$app/navigation';

  import type { TicketDocument } from '$lib/models/ticket';
  import type { UserDocument } from '$lib/models/user';

  import config from '$lib/config';

  import { UserRole } from '$lib/constants';
  import type { PageData } from './$types';
  export let data: PageData;

  onMount(() => {
    const user = data.user as UserDocument;
    const ticket = data.ticket as TicketDocument;

    if (user.roles.includes(UserRole.OPERATOR)) {
      goto(config.PATH.operator);
    } else if (user.roles.includes(UserRole.AGENT)) {
      goto(config.PATH.agent);
    } else if (user.roles.includes(UserRole.CREATOR)) {
      goto(config.PATH.creator);
    } else if (user.roles.includes(UserRole.TICKET_HOLDER) && ticket) {
      goto(urlJoin(config.PATH.ticket, ticket._id.toString()));
    } else {
      goto(config.PATH.websiteUrl);
    }
  });
</script>
