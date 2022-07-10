<script type="ts">
	import { browser } from '$app/env';
	import { page } from '$app/stores';
	import VideoCall from 'components/VideoCall.svelte';
	import VideoPreview from 'components/VideoPreview.svelte';
	import LinkDetail from 'components/web3/LinkDetail.svelte';
	import { gun } from 'db';
	import { LinkById, type Link } from 'db/models/link';
	import { userStream, type UserStreamType } from 'lib/userStream';
	import type { VideoCallType } from 'lib/videoCall';
	import { onMount } from 'svelte';
	import FaMoneyBillWave from 'svelte-icons/fa/FaMoneyBillWave.svelte';
	import Image from 'svelte-image';
	import StarRating from 'svelte-star-rating';
	let link: Link;
	let id = $page.params.id;
	let linkById = gun.get(LinkById);
	$: rating = 0;

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
			vc = videoCall();
			vc.callState.subscribe((state) => {
				callState = state;
			});
		});
	}

	$: linkById.get(id).on((_link) => {
		if (_link) {
			link = _link;
		}
	});

	onMount(async () => {
		us = await userStream();
		us.mediaStream.subscribe((stream) => {
			if (stream) mediaStream = stream;
		});
	});

	const call = async () => {
		if (vc) {
			vc.makeCall(link.callId!, 'Dr. Huge Mongus', mediaStream);
		}
	};
	$: inCall = callState == 'connectedAsCaller';
</script>

<div class="min-h-full">
	<main class="py-6">
		{#if link}
			{#if !inCall}
				<!-- Page header -->
				<div class="text-center">
					<h1 class="font-bold text-center text-5xl">Make your pCall</h1>
					<p class="py-6">Scis vis facere illud pCall. Carpe florem et fac quod nunc vocant.</p>
				</div>
				<div
					class="mx-auto max-w-3xl  sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:max-w-7xl lg:px-8"
				>
					<div class="rounded-box h-full bg-base-200">
						<div>
							<LinkDetail {link} />
						</div>
						<div class="btn-group justify-center pb-6">
							<button class="btn btn-secondary" on:click={call} disabled={callState != 'ready'}
								>Call {link.name} Now</button
							>
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
			{:else}
				<VideoCall {vc} {us} />
			{/if}
		{:else}
			<h1>Searching for your pCall</h1>
		{/if}
	</main>
</div>
