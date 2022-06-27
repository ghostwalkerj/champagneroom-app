<script lang="ts">
	import VideoCall from 'components/VideoCall.svelte';
	import { selectedAccount } from 'svelte-web3';
</script>

<VideoCall address={$selectedAccount} userName={'Chyna'} />
