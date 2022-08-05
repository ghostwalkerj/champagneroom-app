<script lang="ts">
	import ConnectButton from '$lib/components/web3/ConnectButton.svelte';
	import { selectedAccount } from 'svelte-web3';
	import { MailIcon, BellIcon, MenuIcon } from 'svelte-feather-icons';
</script>

<header>
	<div class="bg-base-100 navbar">
		<div class="flex-1">
			<!-- svelte-ignore a11y-missing-attribute -->
			<a class="text-xl btn btn-ghost normal-case">
				<img src="/logo.png" alt="Logo" width="48" /></a
			>
			<MenuIcon />
		</div>

		<div class="flex-none">
			{#if $selectedAccount}
				<div class="flex space-x-6 pr-6">
					<MailIcon />
					<BellIcon />
				</div>
			{/if}
			<ConnectButton />
		</div>
	</div>
</header>
<main>
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
						Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam. Posuit eam ad opus nunc
						et adepto a pCall!
					</p>
					<ConnectButton />
				</div>
			</div>
		</div>
	{/if}
</main>
