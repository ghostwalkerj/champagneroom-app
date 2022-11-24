<script lang="ts">
	import { enhance } from '$app/forms';
	import type { LinkDocType } from '$lib/ORM/models/link';

	export let showCallEnded = false;
	export let link: LinkDocType;
	export let canCall = false;
	export let call: () => Promise<void>;

	export let form: import('./$types').ActionData;

	let rating = 0;

	const closeModal = () => {
		showCallEnded = false;
	};
</script>

<input type="checkbox" id="callended-modal" class="modal-toggle" bind:checked={showCallEnded} />
<div class="modal">
	<div class="modal-box card w-96 bg-neutral text-neutral-content">
		<div class="card-body items-center text-center">
			<h2 class="card-title">How was your pCall?</h2>
			<form method="post" action="?/feedback" use:enhance>
				<div class="flex flex-col gap-6 items-center">
					<div class="rating">
						<input type="radio" name="rating" class="rating-hidden" bind:group={rating} value={0} />

						<input
							type="radio"
							name="rating"
							bind:group={rating}
							class="mask mask-star"
							value={1}
						/>

						<input
							type="radio"
							name="rating"
							bind:group={rating}
							class="mask mask-star"
							value={2}
						/>

						<input
							type="radio"
							name="rating"
							bind:group={rating}
							class="mask mask-star"
							value={3}
						/>

						<input
							type="radio"
							name="rating"
							bind:group={rating}
							class="mask mask-star"
							value={4}
						/>

						<input
							type="radio"
							name="rating"
							bind:group={rating}
							class="mask mask-star"
							value={5}
						/>
					</div>
					{#if form?.missingRating || form?.invalidRating}<div class="shadow-lg alert alert-error">
							Please rate your call
						</div>{/if}
					<div>
						<input type="text" placeholder="Comment" class="input w-full max-w-xs" name="comment" />
					</div>
					<div>
						<button class="btn btn-secondary" type="submit">Leave Feedback</button>
					</div>
				</div>
			</form>
			<div class="divider">OR</div>
			<button class="btn btn-secondary" disabled={true}>Initiate Dispute</button>
			<div class="divider">OR</div>
			<button class="btn btn-secondary" disabled={!canCall} on:click={call}>
				Call {link.talentInfo.name} Again</button
			>
		</div>
	</div>
</div>
