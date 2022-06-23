<script type="ts">
	import { LinkDocument } from 'db/models/Link';
	import { currentLink } from 'db/stores/LinkStore';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';

	let link: LinkDocument = null;
	$: linkURL = '';
	currentLink.subscribe((_link) => {
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
	<div class="card-body">
		{#if linkURL.length > 0}
			<h2 class="card-title">Here is your unique pCall link</h2>
			<div class="text-left">{linkURL}</div>
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
