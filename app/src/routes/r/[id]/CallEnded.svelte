<script lang="ts">
	import { graceTimer, LinkMachineStateType } from '$lib/machines/linkMachine';
	import type { LinkDocType } from '$lib/ORM/models/link';

	export let showCallEnded = false;
	export let link: LinkDocType;
	export let linkMachineState: LinkMachineStateType;

	const canCallTimer = graceTimer(linkMachineState.context.linkState.claim?.call?.startedAt || 0);
	$: minutesCanCall = Math.floor(canCallTimer / (1000 * 60));

	const closeModal = () => {
		showCallEnded = false;
	};
</script>

<input type="checkbox" id="callended-modal" class="modal-toggle" bind:checked={showCallEnded} />
<div class="modal">
	<div class="modal-box card w-96 bg-neutral text-neutral-content">
		<div class="card-body items-center text-center">
			<h2 class="card-title">How was your pCall?</h2>
			<div class="flex flex-col w-full border-opacity-50">
				<div class="grid h-20 card bg-base-300 rounded-box place-items-center">
					You can still reconnect with {link.talentInfo.name} for
					<div>
						<span class="countdown font-mono text-4xl">
							{minutesCanCall}
						</span>
					</div>
				</div>
				<div class="divider">OR</div>
				<div class="grid h-20 card bg-base-300 rounded-box place-items-center">Leave Feedback</div>
				<div class="divider">OR</div>
				<div class="grid h-20 card bg-base-300 rounded-box place-items-center">
					Intiate a Dispute
				</div>
			</div>
			<div class="card-actions justify-end">
				<button class="btn btn-secondary" on:click={closeModal}>Close</button>
			</div>
		</div>
	</div>
</div>
