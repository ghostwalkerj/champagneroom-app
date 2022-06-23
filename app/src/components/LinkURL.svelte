<script type="ts">
	import { LinkDocument, type LinkDocumentType } from 'db/models/Link';
	import { linkStore } from 'db/stores/LinkStore';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';

	let link: LinkDocumentType = null;
	let linkURL = '';
	linkStore.subscribe((_link) => {
		link = _link;
		if (link) {
			linkURL = LinkDocument.generateLinkURL(link);
		} else {
			linkURL = '';
		}
	});

	const copyLink = () => {
		navigator.clipboard.writeText(linkURL);
	};
</script>

<div class="bg-primary text-primary-content card">
	<div class="card-body items-center text-center">
		{#if linkURL.length > 0}
			<h2 class="card-title text-2xl">Outstanding pCall Link</h2>

			<div class="container mx-auto p-6 grid grid-cols-2 gap-4">
				<div class="bg-info text-accent-content rounded-box items-center p-4 shadow-xl ">
					<div class="stat-title">Your Name Shown</div>
					<div class="stat-value">{link.name}</div>
				</div>
				<div class="bg-info text-accent-content rounded-box items-center p-4 shadow-xl">
					<div class="stat-title">Amount</div>
					<div class="stat-value">${link.amount} USD</div>
				</div>
			</div>

			<div class="card-title text-md">URL</div>

			<div>{linkURL}</div>
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
