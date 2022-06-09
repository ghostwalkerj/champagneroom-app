<script type="ts">
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import { selectedAccount } from 'svelte-web3';
</script>

<div class="hero min-h-screen bg-base-200">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<h1 class="text-5xl font-bold">Request a pCall</h1>
			<p class="py-6">
				Provident cupiditate voluptatem et in. Quaerat fugiat ut assumenda excepturi exercitationem
				quasi. In deleniti eaque aut repudiandae et a id nisi.
			</p>

			{#if $selectedAccount}
				<button class="btn btn-primary">Get Started</button>
			{:else}
				<ConnectButton />
			{/if}
		</div>
	</div>
</div>
