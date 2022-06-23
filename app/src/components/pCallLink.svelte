<script type="ts">
	import type { LinkType } from 'db';
	import { currentLink } from 'db';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';

	let pCallLink: LinkType = {};
	currentLink.subscribe((link) => {
		pCallLink = link;
	});

	const copyLink = () => {
		navigator.clipboard.writeText(pCallLink);
	};
</script>

<div class="bg-primary text-primary-content card">
	<div class="card-body">
		<h2 class="card-title">Here is your unique pCall link</h2>
		<div class="text-left">{pCallLink}</div>
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
	</div>
</div>
