<script type="ts">
	import VideoPreview from 'components/VideoPreview.svelte';
	import type { LinkDocumentType } from 'db/models/link';
	import { userStream, type UserStreamType } from 'lib/userStream';
	import type { VideoCallType } from 'lib/videoCall';
	import { selectedAccount } from 'svelte-web3';
	import VideoCall from 'components/VideoCall.svelte';
	import { onDestroy, onMount } from 'svelte';

	export let linkDocument: LinkDocumentType;
	export let success: boolean = false;

	let vc: VideoCallType;
	let callState: typeof vc.callState;
	let videoCall;

	onDestroy(() => {
		if (vc) {
			vc.hangUp();
			vc.destroy();
		}
	});

	// vc = videoCall('111', 'Dr. Huge Mongus');
	// callState = vc.callState;

	let us: Awaited<UserStreamType>;

	onMount(async () => {
		us = await userStream();
		videoCall = (await import('lib/videoCall')).videoCall;
		selectedAccount.subscribe((account) => {
			if (account) {
				vc = videoCall(account, 'Dr. Huge Mongus');
				callState = vc.callState;
			}
		});
	});

	const call = async () => {
		if (vc) {
			vc.makeCall(linkDocument.address, us.mediaStream);
		}
	};
	$: inCall = $callState == 'connectedAsCaller';
</script>

<div class="min-h-full">
	<main class="py-10">
		{#if success}
			{#if !inCall}
				<!-- Page header -->
				<div
					class="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:max-w-7xl lg:px-8"
				>
					<div class="flex flex-col space-x-5 w-full items-center ">
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

						<div class="bg-primary  text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Your Video Preview</h2>
								<div class="container rounded-2xl max-w-2xl">
									<VideoPreview />
								</div>
								{$callState}
							</div>
						</div>
					</div>
				</div>
			{:else}
				<VideoCall {vc} {us} />
			{/if}
		{:else}
			<h1 class="font-bold text-5xl">Invalid link</h1>
		{/if}
	</main>
</div>
