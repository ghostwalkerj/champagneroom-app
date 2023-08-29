<script lang="ts">
  import axios from 'axios';
  import { onMount } from 'svelte';

  import { PUBLIC_BITCART_URL } from '$env/static/public';

  import { createTokenTokenPost } from '../../../lib/util/bitcart/index';
  axios.defaults.baseURL = PUBLIC_BITCART_URL;

  onMount(async () => {
    const resp = await createTokenTokenPost({
      email: 'pcall@citizenmail.org',
      password: 'Unlimited7-Overcrowd-Filing',
      permissions: ['full_control']
    });
    console.log(resp);
  });
</script>
