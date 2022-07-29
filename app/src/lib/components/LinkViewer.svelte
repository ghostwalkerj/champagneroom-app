<script type="ts">
	import type { LinkDocument } from '$lib/ORM/models/link';
	import type { TalentDocument } from '$lib/ORM/models/talent';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';
	export let link: LinkDocument;
	export let talent: TalentDocument;
	import { page } from '$app/stores';
	import { ROOM_PATH } from '$lib/constants';
	import urlJoin from 'url-join';

	$: linkURL = '';
	$: if (link) linkURL = urlJoin($page.url.origin, ROOM_PATH, link._id);

	const copyLink = () => {
		navigator.clipboard.writeText(linkURL);
	};
</script>

<div class="bg-primary text-primary-content card">
	<div class="text-center card-body items-center">
		{#if talent && link}
			<h2 class="text-2xl card-title">Your Outstanding pCall Link</h2>

			<div class="container mx-auto grid p-6 gap-4 grid-row-2">
				<div class="bg-info rounded-box shadow-xl text-accent-content p-4 items-center ">
					<div class="stat-title">Name Shown</div>
					<div class="stat-value">{talent.name}</div>
				</div>
				<div class="bg-info rounded-box shadow-xl text-accent-content p-4 items-center">
					<div class="stat-title">Amount Requested</div>
					<div class="stat-value">${link.amount} USD</div>
				</div>
			</div>

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
						<div class="text-sm text-gray-200 group-hover:text-white">Copy link</div>
					</div>
				</button>
			</div>
		{:else}
			You do not have any pCall links active
		{/if}
	</div>
</div>
