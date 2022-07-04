<script type="ts">
	import { browser } from '$app/env';
	import VideoCall from 'components/VideoCall.svelte';
	import VideoPreview from 'components/VideoPreview.svelte';
	import type { LinkDocument } from 'db/models/link';
	import { createForm } from 'felte';
	import { userStream, type UserStreamType } from 'lib/userStream';
	import type { VideoCallType } from 'lib/videoCall';
	import { onMount } from 'svelte';
	import Image from 'svelte-image';

	export let linkDocument: LinkDocument;
	export let success: boolean = false;

	let creator = linkDocument.creator || { name: '', profileImageUrl: '', feedBackAvg: '0' };

	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	let vc: VideoCallType;
	let videoCall;
	let mediaStream: MediaStream;
	let us: Awaited<UserStreamType>;
	$: callState = 'disconnected';

	if (browser) {
		import('lib/videoCall').then((_vc) => {
			videoCall = _vc.videoCall;
		});
	}

	onMount(async () => {
		us = await userStream();
		vc = videoCall();
		vc.callState.subscribe((state) => {
			callState = state;
		});
		us.mediaStream.subscribe((stream) => {
			if (stream) mediaStream = stream;
		});
	});

	const call = async () => {
		if (vc) {
			vc.makeCall(linkDocument.callId, 'Dr. Huge Mongus', mediaStream);
		}
	};
	$: inCall = callState == 'connectedAsCaller';
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

						<div class="flex flex-col p-2  items-center min-w-lg">
							<div
								class="bg-base-200 rounded-box col-span-3 row-span-3 mx-2 grid w-72 flex-shrink-0 place-items-center items-center gap-4 p-4 py-8 shadow-xl xl:mx-0 xl:w-full"
							>
								<div class="text-center">
									<div class="text-lg font-extrabold">This pCall is For</div>
									<div class="text-3xl font-extrabold">{creator.name}</div>
								</div>
								<div class="rounded-full flex-none h-48 w-48 mask-circle">
									<Image
										src={creator.profileImageUrl}
										alt={creator.name}
										height="48"
										width="48"
										class="rounded-full flex-none object-cover mask-circle"
									/>
								</div>
								<div class="rating gap-1">
									<input type="radio" name="rating-3" class="mask mask-heart bg-red-400" />
									<input type="radio" name="rating-3" class="mask mask-heart bg-orange-400" />
									<input type="radio" name="rating-3" class="mask mask-heart bg-yellow-400" />
									<input type="radio" name="rating-3" class="mask mask-heart bg-lime-400" checked />
									<input type="radio" name="rating-3" class="mask mask-heart bg-green-400" />
								</div>

								<div class="stats shadow">
									<div class="stat">
										<div class="stat-figure text-primary">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												class="inline-block w-8 h-8 stroke-current"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
												/></svg
											>
										</div>
										<div class="stat-title">Requested Funding</div>
										<div class="stat-value text-primary">
											{formatter.format(Number.parseInt(linkDocument.amount))}
										</div>
									</div>

									<div class="stat">
										<div class="stat-figure text-secondary">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												class="inline-block w-8 h-8 stroke-current"
												><path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M13 10V3L4 14h7v7l9-11h-7z"
												/></svg
											>
										</div>
										<div class="stat-title">Amount Funded</div>
										<div class="stat-value text-secondary">
											{formatter.format(Number.parseInt(linkDocument.fundedAmount))}
										</div>
									</div>
								</div>

								<div class="btn-group">
									<button class="btn btn-accent btn-sm">Call</button>
								</div>
							</div>
						</div>

						<div class="bg-primary  text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Your Video Preview</h2>
								<div class="container rounded-2xl max-w-2xl">
									<VideoPreview {us} />
								</div>
								Call State: {callState}
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
