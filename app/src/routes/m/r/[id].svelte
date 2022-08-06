<script lang="ts">
	import LinkFeedback from '$lib/components/Feedback.svelte';
	import LinkDetail from '$lib/components/LinkDetail.svelte';
	import type { LinkDocument } from '$lib/ORM/models/link';

	let link: LinkDocument;
	// let linkId = $page.params.id;

	$: callState = 'disconnected';

	// let feedback: Feedback | null = null;

	// onMount(async () => {
	// 	gun = (await import('$lib/db/gun')).gun;
	// 	// get link
	// 	gun
	// 		.get(LinkType)
	// 		.get(linkId)
	// 		.on((_link) => {
	// 			link = _link;
	// 		});

	// 	if (feedback == null) {
	// 		gun
	// 			.get(FeedbackType)
	// 			.get(linkId, (ack) => {
	// 				if (!ack.put) {
	// 					feedback = createFeedback({
	// 						linkId,
	// 						rejectedCount: 0,
	// 						disconnectCount: 0,
	// 						notAnsweredCount: 0,
	// 						rating: 0,
	// 						viewedCount: 0
	// 					});
	// 					gun.get(FeedbackType).get(linkId).put(feedback);
	// 				}
	// 			})
	// 			.on((_feedback) => {
	// 				if (_feedback && !feedback) {
	// 					feedback = _feedback;
	// 				}
	// 			});
	// 	}
	// });

	$: showFeedback = false;
</script>

<LinkFeedback {showFeedback} />
<div class="h-full w-full">
	{#if link}
		<div class="container	mx-auto max-w-max bg-base-200  items-center ">
			<div>
				<LinkDetail {link} />
			</div>
			<div class="pb-6 btn-group justify-center">
				<button class="btn btn-secondary" disabled={callState != 'ready'}
					>Call {link.talentName} Now</button
				>
			</div>
		</div>
	{:else}
		<h1>Searching for your pCall</h1>
	{/if}
</div>
