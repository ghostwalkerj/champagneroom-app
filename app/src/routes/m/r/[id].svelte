<script type="ts">
	import { page } from '$app/stores';
	import LinkFeedback from 'lib/components/Feedback.svelte';
	import LinkDetail from 'lib/components/LinkDetail.svelte';
	import { createFeedback, FeedbackType, type Feedback } from 'db/models/feedback';
	import { LinkType, type Link } from 'db/models/link';
	import { onMount } from 'svelte';

	let link: Link;
	let linkId = $page.params.id;

	$: callState = 'disconnected';

	let feedback: Feedback | null = null;
	let gun;

	onMount(async () => {
		gun = (await import('db/gun')).gun;
		// get link
		gun
			.get(LinkType)
			.get(linkId)
			.on((_link) => {
				link = _link;
			});

		if (feedback == null) {
			gun
				.get(FeedbackType)
				.get(linkId, (ack) => {
					if (!ack.put) {
						feedback = createFeedback({
							linkId,
							rejectedCount: 0,
							disconnectCount: 0,
							notAnsweredCount: 0,
							rating: 0,
							viewedCount: 0
						});
						gun.get(FeedbackType).get(linkId).put(feedback);
					}
				})
				.on((_feedback) => {
					if (_feedback && !feedback) {
						feedback = _feedback;
					}
				});
		}
	});

	$: showFeedback = false;
</script>

<LinkFeedback {showFeedback} />
<div class="h-full w-full">
	{#if link}
		<div class="max-w-max	bg-base-200 container mx-auto  items-center ">
			<div>
				<LinkDetail {link} />
			</div>
			<div class="btn-group justify-center pb-6">
				<button class="btn btn-secondary" disabled={callState != 'ready'}
					>Call {link.name} Now</button
				>
			</div>
		</div>
	{:else}
		<h1>Searching for your pCall</h1>
	{/if}
</div>
