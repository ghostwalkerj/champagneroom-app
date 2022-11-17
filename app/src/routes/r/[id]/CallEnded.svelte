<script lang="ts">
	import type { LinkDocType } from '$lib/ORM/models/link';

	export let showCallEnded = false;
	export let link: LinkDocType;
	export let canCall = false;

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
			<form method="post" action="?/feedback">
				<div class="flex flex-col ">
					<div class="rating">
						<input
							type="radio"
							name="rating-1"
							class="rating-hidden"
							checked
							on:change={() => {
								rating = 0;
							}}
						/>

						<input
							type="radio"
							name="rating-1"
							on:change={() => {
								rating = 1;
							}}
							class="mask mask-star"
						/>
						<input
							type="radio"
							name="rating-1"
							class="mask mask-star"
							on:change={() => {
								rating = 2;
							}}
						/>
						<input
							type="radio"
							name="rating-1"
							class="mask mask-star"
							on:change={() => {
								rating = 3;
							}}
						/>
						<input
							type="radio"
							name="rating-1"
							class="mask mask-star"
							on:change={() => {
								rating = 4;
							}}
						/>
						<input
							type="radio"
							name="rating-1"
							class="mask mask-star"
							on:change={() => {
								rating = 5;
							}}
						/>
					</div>
					<div>
						<input type="text" placeholder="Review" class="input w-full max-w-xs" />
					</div>
					<div>
						<button class="btn btn-secondary" type="submit">Leave Feedback</button>
					</div>
				</div>
			</form>
			<div class="divider">OR</div>
			<button class="btn btn-secondary" disabled={true}>Initiate Dispute</button>
			<div class="divider">OR</div>
			<button class="btn btn-secondary" disabled={!canCall}>
				Call {link.talentInfo.name} Again</button
			>
		</div>
	</div>
</div>
