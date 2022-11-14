<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_DEFAULT_PROFILE_IMAGE, PUBLIC_ROOM_PATH } from '$env/static/public';
	import { currencyFormatter } from '$lib/util/constants';
	import getProfileImage from '$lib/util/profilePhoto';
	import spacetime from 'spacetime';
	import FaMoneyBillWave from 'svelte-icons/fa/FaMoneyBillWave.svelte';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';
	import urlJoin from 'url-join';
	import type { LinkDocument } from '$lib/ORM/models/link';
	import type { LinkMachineStateType } from '$lib/machines/linkMachine';
	export let link: LinkDocument;
	export let linkMachineState: LinkMachineStateType;

	const claim = (linkMachineState && linkMachineState.context.linkState.claim) || {
		caller: '',
		createdAt: ''
	};

	$: callerProfileImage =
		(link && link.linkState.claim && getProfileImage(link.linkState.claim.caller)) ||
		PUBLIC_DEFAULT_PROFILE_IMAGE;

	$: linkURL = link && urlJoin($page.url.origin, PUBLIC_ROOM_PATH, link._id);

	let tooltipOpen = '';
	const copyLink = () => {
		navigator.clipboard.writeText(linkURL);
		tooltipOpen = 'tooltip-open';
		setTimeout(() => (tooltipOpen = ''), 2000);
	};
</script>

<div class="bg-primary text-primary-content card">
	<div class="text-center card-body items-center">
		<h2 class="text-2xl card-title">Your Outstanding pCall Link</h2>
		{#if link && linkMachineState && !linkMachineState.done}
			<div class="container mx-auto grid p-6 gap-4 grid-row-2">
				<div class="text-center card-body items-center bg-secondary rounded-2xl">
					<div class="text-xl w-full">
						{#if linkMachineState.matches('unclaimed')}
							Your pCall link has Not Been Claimed
						{:else if linkMachineState.matches('claimed')}
							<div class="w-full ">
								Your pCall link was claimed by:
								<div class="p-6 flex flex-row w-full place-content-evenly items-center">
									<div
										class="bg-cover bg-no-repeat bg-center rounded-full h-32 w-32"
										style="background-image: url('{callerProfileImage}')"
									/>
									<div>
										<div>{claim.caller}</div>
										<div>on</div>
										<div>{spacetime(claim.createdAt).format('nice-short')}</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				</div>

				<section
					class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-white text-center items-center justify-center"
				>
					<div class="stats stats-vertical stats-shadow md:stats-horizontal">
						<div class="stat">
							<div class="text-primary w-10 stat-figure">
								<FaMoneyBillWave />
							</div>
							<div class="stat-title">Amount Requested</div>
							<div class="text-primary stat-value">
								{currencyFormatter.format(link.requestedAmount)}
							</div>
						</div>

						<div class="stat">
							<div class="text-secondary w-10 stat-figure">
								<FaMoneyBillWave />
							</div>
							<div class="stat-title">Total Funded</div>
							<div class="text-secondary stat-value">
								{currencyFormatter.format(link.linkState.totalFunding || 0)}
							</div>
						</div>
					</div>
					{#if link.linkState.totalFunding >= link.requestedAmount}
						<div class="text-xl pb-4">Link is Fully Funded!</div>
					{/if}
				</section>
				<section
					class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-white text-center p-4  items-center justify-center "
				>
					<div>Funding Address</div>
					<div class="break-all">{link.fundingAddress}</div>
				</section>

				<section
					class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-center p-4 items-center justify-center bg-info text-accent-content "
				>
					<div>Unique pCall Link</div>
					<div class="break-all">
						{linkURL}
						<button on:click={copyLink}>
							<div class="cursor-pointer flex group">
								<div class="h-5 mr-1 mb-1 pl-2 group-hover:text-white">
									<FaRegCopy />
								</div>
								<div class="text-sm group-hover:text-white">
									<div class="tooltip tooltip-accent {tooltipOpen}" data-tip="Copied!" />
								</div>
							</div>
						</button>
					</div>
				</section>
			</div>
		{:else if !link}
			Loading....
		{:else}
			You do not have any pCall links active
		{/if}
	</div>
</div>
