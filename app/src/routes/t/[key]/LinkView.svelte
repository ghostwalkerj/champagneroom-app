<script lang="ts">
	import { page } from '$app/stores';
	import type { LinkDocType } from '$lib/ORM/models/link';
	import type { TalentDocType } from '$lib/ORM/models/talent';
	import { currencyFormatter } from '$lib/util/constants';
	import { PUBLIC_ROOM_PATH } from '$env/static/public';
	import FaMoneyBillWave from 'svelte-icons/fa/FaMoneyBillWave.svelte';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';
	import urlJoin from 'url-join';
	export let link: LinkDocType;
	export let talent: TalentDocType;
	let tooltipOpen = '';

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
		{#if talent && link}
			<div class="container mx-auto grid p-6 gap-4 grid-row-2">
				<div class="bg-info rounded-box shadow-xl text-accent-content p-4 items-center ">
					<div class="stat-title">Name Shown</div>
					<div class="stat-value">{talent.name}</div>
				</div>
				<div>
					<div class="max-w-min stats stats-vertical stats-shadow lg:stats-horizontal">
						<div class="stat">
							<div class="text-primary w-10 stat-figure">
								<FaMoneyBillWave />
							</div>
							<div class="stat-title">Amount Requested</div>
							<div class="text-primary stat-value">
								{currencyFormatter.format(link.amount)}
							</div>
						</div>

						<div class="stat">
							<div class="text-secondary w-10 stat-figure">
								<FaMoneyBillWave />
							</div>
							<div class="stat-title">Amount Funded</div>
							<div class="text-secondary stat-value">
								{currencyFormatter.format(link.fundedAmount)}
							</div>
						</div>
					</div>
				</div>
			</div>
			<section
				class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-white text-center p-4  items-center justify-center "
			>
				<div>Funding Address</div>
				<div class="break-all">{link.fundingAddress}</div>
			</section>

			<div class="text-md card-title">URL</div>

			<div class="bg-info rounded-box shadow-xl text-accent-content p-4 items-center ">
				{linkURL}
			</div>
			<div class="pt-4 card-actions justify-end">
				<button on:click={copyLink}>
					<div class="cursor-pointer flex group">
						<div class="h-5 mr-1 mb-1 pl-2 group-hover:text-white">
							<FaRegCopy />
						</div>
						<div class="text-sm text-gray-200 group-hover:text-white">
							<div class="tooltip tooltip-success {tooltipOpen}" data-tip="Copied!">Copy link</div>
						</div>
					</div>
				</button>
			</div>
		{:else if talent.currentLink}
			Loading....
		{:else}
			You do not have any pCall links active
		{/if}
	</div>
</div>
