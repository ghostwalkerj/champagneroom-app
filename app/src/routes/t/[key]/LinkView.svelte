<script lang="ts">
	import { page } from '$app/stores';
	import { PUBLIC_DEFAULT_PROFILE_IMAGE, PUBLIC_ROOM_PATH } from '$env/static/public';
	import type { LinkMachineStateType } from '$lib/machines/linkMachine';
	import type { LinkDocType } from '$lib/ORM/models/link';
	import type { TalentDocType } from '$lib/ORM/models/talent';
	import { currencyFormatter } from '$lib/util/constants';
	import getProfileImage from '$lib/util/profilePhoto';
	import FaMoneyBillWave from 'svelte-icons/fa/FaMoneyBillWave.svelte';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';
	import urlJoin from 'url-join';
	export let link: LinkDocType;
	export let talent: TalentDocType;
	export let linkState: LinkMachineStateType | undefined;
	let tooltipOpen = '';

	$: callerProfileImage =
		link && link.state.claim
			? getProfileImage(link.state.claim.caller)
			: PUBLIC_DEFAULT_PROFILE_IMAGE;

	$: linkURL = '';
	$: if (link) linkURL = urlJoin($page.url.origin, PUBLIC_ROOM_PATH, link._id);

	const copyLink = () => {
		navigator.clipboard.writeText(linkURL);
		tooltipOpen = 'tooltip-open';
		setTimeout(() => (tooltipOpen = ''), 2000);
	};
</script>

<div class="bg-primary text-primary-content card">
	<div class="text-center card-body items-center">
		<h2 class="text-2xl card-title">Your Outstanding pCall Link</h2>
		{#if talent && link && linkState && !linkState.done}
			<div class="container mx-auto grid p-6 gap-4 grid-row-2">
				<div class="text-center card-body items-center bg-secondary rounded-2xl">
					<div class="text-xl w-full">
						{#if linkState.matches('unclaimed')}
							Your pCall link has Not Been Claimed
						{:else if linkState.matches('claimed') && link.state.claim}
							<div class="w-full ">
								Your pCall link was claimed by:
								<div class="p-6 flex flex-row w-full place-content-evenly items-center">
									<div>
										<div>{link.state.claim.caller}</div>
										<div>on</div>
										<div>{new Date(link.state.claim.createdAt).toLocaleString()}</div>
									</div>
									<div
										class="bg-cover bg-no-repeat bg-center rounded-full h-32 w-32"
										style="background-image: url('{callerProfileImage}')"
									/>
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
								{currencyFormatter.format(link.state.totalFunding)}
							</div>
						</div>
					</div>
					{#if link.state.totalFunding >= link.requestedAmount}
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
		{:else if talent.currentLink && linkState && !linkState.done}
			Loading....
		{:else}
			You do not have any pCall links active
		{/if}
	</div>
</div>
