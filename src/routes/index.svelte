<script lang="ts">
	import HeaderItem from 'components/HeaderItem.svelte';
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import FaRegUserCircle from 'svelte-icons/fa/FaRegUserCircle.svelte';
	import GiTheaterCurtains from 'svelte-icons/gi/GiTheaterCurtains.svelte';
	import MdDashboard from 'svelte-icons/md/MdDashboard.svelte';
	import { selectedAccount } from 'svelte-web3';
	export let url;

	selectedAccount.subscribe(async (account) => {
		if (account) {
		}
	});
</script>

<nav class=" flex flex-col h-auto mx-5 mt-4 justify-between items-center md:flex-row">
	<div class="flex flex-grow max-w-lg mt-2 justify-items-start">
		<HeaderItem title="HOME" path="/talent">
			<MdDashboard />
		</HeaderItem>
		<HeaderItem title="PROFILE" path="/talent/profile">
			<FaRegUserCircle />
		</HeaderItem>
		<HeaderItem title="ON STAGE" path="/talent/show">
			<GiTheaterCurtains />
		</HeaderItem>
	</div>
	<div class="pb-5">
		<ConnectButton />
	</div>
</nav>

<div class="h-full">
	<slot />
</div>
