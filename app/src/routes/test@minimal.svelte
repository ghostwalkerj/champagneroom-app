<script lang="ts">
	import { browser } from '$app/env';
	import { onMount } from 'svelte';

	onMount(async () => {
		const Peer = (await import('peerjs')).default;

		const peer = new Peer('someid', {
			host: 'localhost',
			port: 9000,
			path: '/'
		});

		console.log(peer);
	});
</script>
