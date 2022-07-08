<script lang="ts">
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import { selectedAccount } from 'svelte-web3';
</script>

{#if $selectedAccount}
	<div class="h-full">
		<slot />
	</div>
{:else}
	<div class="min-h-screen-md bg-base-100 hero">
		<div class="text-center hero-content">
			<div class="max-w-md">
				<h1 class="font-bold text-5xl">Welcome to pCall</h1>
				<p class="py-6">
					Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam. Posuit eam ad opus nunc et
					adepto a pCall!
				</p>
				<ConnectButton />
			</div>
		</div>
	</div>
{/if}
