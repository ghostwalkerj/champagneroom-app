<script type="ts">
	import { onMount } from 'svelte';
	import FaExternalLinkAlt from 'svelte-icons/fa/FaExternalLinkAlt.svelte';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';
	import FaWindowClose from 'svelte-icons/fa/FaWindowClose.svelte';
	import { connected, defaultEvmStores, selectedAccount, web3 } from 'svelte-web3';
	import JazzIcon from './JazzIcon.svelte';

	let pending = 'pending';
	const enable = () => defaultEvmStores.setProvider();
	const disable = () => defaultEvmStores.disconnect();

	onMount(async () => {
		// add a test to return in SSR context
		await defaultEvmStores.setProvider();
	});

	function copyAddress() {
		navigator.clipboard.writeText($selectedAccount);
	}

	function formatEth(balance: any) {
		return Number($web3.utils.fromWei(balance, 'ether')).toFixed(4);
	}

	$: balance = $connected && $selectedAccount ? $web3.eth.getBalance($selectedAccount) : '';
</script>

{#if !$connected || !$selectedAccount}
	<button
		class="bg-gradient-to-r rounded-xl font-medium from-pink-800 via-purple-900 to-blue-900  border-2 border-purple-700  shadow-sm text-sm text-white py-2 px-4 inline-flex  items-center whitespace-nowrap hover:border-pink-800"
		on:click={enable}
	>
		Connect to Wallet
	</button>
{:else}
	<div>
		<div class="card card-side bordered  ">
			<div class="px-2 pt-2.5 card">
				{#if $selectedAccount}{#await balance}{pending}{:then value}{formatEth(value)} ETH{/await}{/if}
			</div>
			<div class="card">
				<label for="my-modal" class="btn modal-button normal-case">
					<div class="flex font-medium items-center">
						<div class="mr-2">
							{$selectedAccount.slice(0, 6)}...{$selectedAccount.slice(
								$selectedAccount.length - 4,
								$selectedAccount.length
							)}
						</div>
						<JazzIcon address={$selectedAccount} />
					</div>
				</label>
				<input type="checkbox" id="my-modal-2" class="modal-toggle" />
			</div>
		</div>
		<input type="checkbox" id="my-modal" class="modal-toggle" />
		<div class="modal">
			<div class="bg-base-300 top-1/4 modal-box fixed">
				<div class="font-light text-lg pl-1 text-gray-300 ">Account</div>
				<div class="pr-6 top-0 right-0 hidden absolute  sm:block">
					<div class="modal-action">
						<label for="my-modal" class="btn btn-square btn-xs">
							<FaWindowClose />
						</label>
					</div>
				</div>
				<div class="bg-base-100 border-2 border-gray-600 m-1 mt-4 p-4   card">
					<div class="flex mb-2 justify-between items-center">
						<p class="text-sm text-gray-400">Connected with MetaMask</p>
						<button
							class="border font-medium border-[#610094] rounded-3xl shadow-sm text-xs py-1.5 px-2.5 text-gray-400 inline-flex items-center hover:border-indigo-400 hover:text-indigo-500 hover:underline focus:outline-none focus:ring-2  focus:ring-offset-2 focus:ring-indigo-500"
							on:click={disable}
						>
							Change
						</button>
					</div>
					<div class="flex mt-2 mb-4 leading-4 items-center align-middle">
						<JazzIcon address={$selectedAccount} />

						<div class="font-semibold  text-xl ml-2 text-gray-200">
							{$selectedAccount.slice(0, 6)}...{$selectedAccount.slice(
								$selectedAccount.length - 4,
								$selectedAccount.length
							)}
						</div>
					</div>
					<div class="flex justify-start">
						<button on:click={copyAddress}>
							<div class="cursor-pointer flex group">
								<div class="h-5 mr-1 mb-1 pl-2 group-hover:text-white">
									<FaRegCopy />
								</div>
								<div class="text-sm text-gray-400 group-hover:text-white">Copy address</div>
							</div>
						</button>
						<div class="pl-6 group">
							<a
								href={`https://etherscan.io/address/${$selectedAccount}`}
								target="_blank"
								rel="noreferrer"
							>
								<div class="cursor-pointer flex">
									<div class="h-5 mr-1 mb-1 group-hover:text-white">
										<FaExternalLinkAlt />
									</div>
									<div class="text-sm text-gray-400 group-hover:text-white">View on Explorer</div>
								</div>
							</a>
						</div>
					</div>
				</div>
				<div class="flex flex-row-reverse bg-[#3F0071] mt-5 pt-4 pr-4 pb-4 card">
					Your transactions will appear here...
				</div>
			</div>
		</div>
	</div>
{/if}
