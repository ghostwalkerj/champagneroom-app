<script lang="ts">
  import { onMount } from 'svelte';

  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  import { type UserDocument, UserRole } from '$lib/models/user';

  import Config from '$lib/config';

  onMount(() => {
    const user = $page.data.user as UserDocument;

    if (user.roles.includes(UserRole.OPERATOR)) {
      goto(Config.Path.operator);
    } else if (user.roles.includes(UserRole.AGENT)) {
      goto(Config.Path.agent);
    } else if (user.roles.includes(UserRole.CREATOR)) {
      goto(Config.Path.creator);
    }
  });
</script>
