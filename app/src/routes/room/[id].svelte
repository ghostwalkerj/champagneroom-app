<script type="ts">
	import { browser } from '$app/env';
	import VideoCall from 'components/VideoCall.svelte';
	import VideoPreview from 'components/VideoPreview.svelte';
	import type { LinkDocument } from 'db/models/link';
	import { userStream,type UserStreamType } from 'lib/userStream';
	import type { VideoCallType } from 'lib/videoCall';
	import { onMount } from 'svelte';
	import FaMoneyBillWave from 'svelte-icons/fa/FaMoneyBillWave.svelte';
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
	<main class="py-6">
		{#if success}
			{#if !inCall}
				<!-- Page header -->
				<div
					class="mx-auto max-w-3xl  sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:max-w-7xl lg:px-8"
				>
					<div class="flex flex-col space-x-5 w-full items-center p-2">
						<h1 class="font-bold text-5xl text-center">Make your pCall</h1>
						<p class="py-6">Scis vis facere illud pCall. Carpe florem et fac quod nunc vocant.</p>
						<div class="flex flex-col w-full gap-6 md:flex-row">
							<div class="flex flex-col w-full ">
								<div
									class="h-full bg-base-200 rounded-box col-span-3 row-span-3 mx-2 grid  flex-shrink-0 place-items-center gap-4 p-4 py-8 shadow-xl xl:mx-0 xl:w-full"
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
										<input
											type="radio"
											name="rating-3"
											class="mask mask-heart bg-lime-400"
											checked
										/>
										<input type="radio" name="rating-3" class="mask mask-heart bg-green-400" />
									</div>

									<div class="stats stats-vertical stats-shadow lg:stats-horizontal">
										<div class="stat">
											<div class="stat-figure text-primary w-10">
												<FaMoneyBillWave />
											</div>
											<div class="stat-title">Requested</div>
											<div class="stat-value text-primary">
												{formatter.format(Number.parseInt(linkDocument.amount))}
											</div>
										</div>

										<div class="stat">
											<div class="stat-figure text-secondary w-10">
												<FaMoneyBillWave />
											</div>
											<div class="stat-title">Funded</div>
											<div class="stat-value text-secondary">
												{formatter.format(Number.parseInt(linkDocument.fundedAmount))}
											</div>
										</div>
									</div>
									<section
										class="flex flex-col bg-base-100 flex-shrink-0 text-white p-4 gap-4 text-center items-center justify-center rounded-2xl  md:gap-8 "
									>
										<div>Funding Address</div>
										<div class="break-all">{linkDocument.walletAddress}</div>
									</section>

									<div class="btn-group">
										<button
											class="btn btn-secondary"
											on:click={call}
											disabled={callState != 'ready'}>Call {creator.name} Now</button
										>
									</div>
								</div>
							</div>

							<div class="bg-base-200 text-white card">
								<div class="text-center card-body items-center">
									<div class="text-2xl card-title">Your Video Preview</div>
									<div class="container rounded-2xl max-w-2xl">
										<VideoPreview {us} />
									</div>
									Call State: {callState}
								</div>
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
