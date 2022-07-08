<script type="ts">
	import { generateLinkURL, type Link } from 'db/models/link';
	import type { Talent } from 'db/models/talent';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';
	export let link: Link;
	export let talent: Talent;
	let linkURL = '';

	linkURL = generateLinkURL(link);

	const copyLink = () => {
		navigator.clipboard.writeText(linkURL);
	};
</script>

{#if talent && link}
	<div class="bg-primary text-primary-content card">
		<div class="card-body items-center text-center">
			{#if linkURL.length > 0}
				<h2 class="card-title text-2xl">Your Outstanding pCall Link</h2>

				<div class="container mx-auto p-6 grid grid-row-2 gap-4">
					<div class="bg-info text-accent-content rounded-box items-center p-4 shadow-xl ">
						<div class="stat-title">Name Shown</div>
						<div class="stat-value">{talent.name}</div>
					</div>
					<div class="bg-info text-accent-content rounded-box items-center p-4 shadow-xl">
						<div class="stat-title">Amount Requested</div>
						<div class="stat-value">${link.amount} USD</div>
					</div>
				</div>

				<div class="card-title text-md">URL</div>

				<div class="bg-info text-accent-content rounded-box items-center p-4 shadow-xl ">
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
{/if}
