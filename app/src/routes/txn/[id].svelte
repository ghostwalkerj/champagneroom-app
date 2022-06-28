<script type="ts">
	import VideoPreview from 'components/VideoPreview.svelte';
	import type { LinkDocumentType } from 'db/models/link';
	import { userStream } from 'lib/userStream';
	import { videoCall, type VideoCallType } from 'lib/videoCall';
	import { selectedAccount } from 'svelte-web3';

	export let linkDocument: LinkDocumentType;
	export let success: boolean = false;

	let vc: VideoCallType;
	let callState: typeof vc.callState;
	selectedAccount.subscribe((account) => {
		if (account) {
			vc = videoCall(account, 'Dr. Huge Mongus');
			callState = vc.callState;
		}
	});

	const call = async () => {
		if (vc) {
			let us = await userStream();
			vc.makeCall(linkDocument.address, us.mediaStream);
		}
	};
</script>

<div class="min-h-screen-md bg-base-100 hero">
	<div class="text-center hero-content">
		<div class="max-w-lg space-y-4">
			{#if success}
				<h1 class="font-bold text-5xl">Make your pCall</h1>
				<p class="py-6">Scis vis facere illud pCall. Carpe florem et fac quod nunc vocant.</p>
				<div class="flex flex-col p-2  items-center">
					<div class="bg-primary text-primary-content stats">
						<div class="stat">
							<div class="stat-title">You are Calling</div>
							<div class="stat-value">{linkDocument.name}</div>
							<div class="stat-actions">
								<button class="btn btn-sm btn-success" on:click={call}>Call (test)</button>
							</div>
						</div>

						<div class="stat">
							<div class="stat-title">Amount</div>
							<div class="stat-value">${linkDocument.amount} USD</div>
							<div class="stat-actions">
								<button class="btn btn-sm">Send</button>
							</div>
						</div>
					</div>
				</div>

				<div class="bg-primary text-primary-content card">
					<div class="card-body items-center text-center">
						<h2 class="card-title text-2xl">Your Video Preview</h2>
						<div class="rounded-2xl">
							<VideoPreview />
						</div>
					</div>
				</div>
				{$callState}
			{:else}
				<h1 class="font-bold text-5xl">Invalid link</h1>
			{/if}
		</div>
	</div>
</div>
