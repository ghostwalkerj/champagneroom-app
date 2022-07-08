<script type="ts">
	import { browser } from '$app/env';
	import VideoCall from 'components/VideoCall.svelte';
	import VideoPreview from 'components/VideoPreview.svelte';
	import { LinkById, type Link } from 'db/models/link';
	import { userStream, type UserStreamType } from 'lib/userStream';
	import type { VideoCallType } from 'lib/videoCall';
	import { onMount } from 'svelte';
	import FaMoneyBillWave from 'svelte-icons/fa/FaMoneyBillWave.svelte';
	import Image from 'svelte-image';
	import StarRating from 'svelte-star-rating';
	import { page } from '$app/stores';
	import { gun } from 'db';
	import { TalentById } from 'db/models/talent';
	import { DEFAULT_PROFILE_IMAGE } from 'lib/constants';

	let talent = { name: '', profileImageUrl: '', feedBackAvg: '0' };
	let link: Link;
	let id = $page.params.id;
	let linkById = gun.get(LinkById);
	let talentById = gun.get(TalentById);

	linkById.get(id).on((_link) => {
		if (_link) {
			link = _link;
			talentById.get(link.talentId).on((_talent) => {
				if (_talent) {
					talent = _talent;
					console.log(talent);
				}
			});
		}
	});

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
			//vc.makeCall(linkDocument.callId, 'Dr. Huge Mongus', mediaStream);
		}
	};
	$: inCall = callState == 'connectedAsCaller';
</script>

<div class="min-h-full">
	<main class="py-6">
		{#if talent}
			{#if !inCall}
				<!-- Page header -->
				<div
					class="mx-auto max-w-3xl  sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:max-w-7xl lg:px-8"
				>
					<div class="flex flex-col space-x-5 w-full p-2 items-center">
						<h1 class="font-bold text-center text-5xl">Make your pCall</h1>
						<p class="py-6">Scis vis facere illud pCall. Carpe florem et fac quod nunc vocant.</p>
						<div class="flex flex-col w-full gap-6 md:flex-row">
							<div class="flex flex-col w-full ">
								<div
									class="rounded-box h-full bg-base-200 flex-shrink-0 shadow-xl mx-2 grid  p-4 py-8 gap-4 col-span-3 row-span-3 place-items-center xl:mx-0 xl:w-full"
								>
									<div class="text-center">
										<div class="font-extrabold text-lg">This pCall is For</div>
										<div class="font-extrabold text-3xl">{talent.name}</div>
									</div>
									<div class="rounded-full flex-none h-48 w-48 mask-circle">
										<Image
											src={talent.profileImageUrl || DEFAULT_PROFILE_IMAGE}
											alt={talent.name}
											height="48"
											width="48"
											class="rounded-full flex-none object-cover mask-circle"
										/>
									</div>
									<StarRating rating={talent.feedBackAvg || 0} />

									<div class="stats stats-vertical stats-shadow lg:stats-horizontal">
										<div class="stat">
											<div class="text-primary w-10 stat-figure">
												<FaMoneyBillWave />
											</div>
											<div class="stat-title">Requested</div>
											<div class="text-primary stat-value">
												{formatter.format(Number.parseInt(link.amount))}
											</div>
										</div>

										<div class="stat">
											<div class="text-secondary w-10 stat-figure">
												<FaMoneyBillWave />
											</div>
											<div class="stat-title">Funded</div>
											<div class="text-secondary stat-value">
												{formatter.format(Number.parseInt(link.fundedAmount || '0'))}
											</div>
										</div>
									</div>
									<section
										class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-white text-center p-4 gap-4 items-center justify-center  md:gap-8 "
									>
										<div>Funding Address</div>
										<div class="break-all">{link.walletAddress}</div>
									</section>

									<div class="btn-group">
										<button
											class="btn btn-secondary"
											on:click={call}
											disabled={callState != 'ready'}>Call {talent.name} Now</button
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
