<script lang="ts">
	import { page } from '$app/stores';
	import VideoCall from '$lib/components/calls/VideoCall.svelte';
	import VideoPreview from '$lib/components/calls/VideoPreview.svelte';
	import { callMachine } from '$lib/machines/callMachine';
	import { createLinkMachineService } from '$lib/machines/linkMachine';
	import { publicDB, type PublicDBType } from '$lib/ORM/dbs/publicDB';
	import type { FeedbackDocType, FeedbackDocument } from '$lib/ORM/models/feedback';
	import type { LinkDocument } from '$lib/ORM/models/link';
	import { StorageTypes } from '$lib/ORM/rxdb';
	import { userStream, type UserStreamType } from '$lib/util/userStream';
	import type { VideoCallType } from '$lib/util/videoCall';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import FeedbackForm from './FeedbackForm.svelte';
	import LinkDetail from './LinkDetail.svelte';
	import type { Subscription } from 'xstate';
	import { enhance } from '$app/forms';
	export let form: import('./$types').ActionData;

	export let data: PageData;

	const token = data.token;
	let linkObj = data.link;
	let feedbackObj = data.feedback;
	let linkId = $page.params.id;
	let vc: VideoCallType;
	let videoCall: any;
	let mediaStream: MediaStream;
	let us: Awaited<UserStreamType>;
	let feedback: FeedbackDocument;

	let linkSub: Subscription;

	$: linkService = createLinkMachineService(linkObj.state);
	$: linkState = linkService.initialState;
	$: showFeedback = false;
	$: inCall = false;
	$: callState = callMachine.initialState;
	$: userstream = false;

	publicDB(token, linkId, StorageTypes.IDB).then((_db: PublicDBType) => {
		_db.links.findOne(linkObj._id).$.subscribe((_link) => {
			if (_link) {
				linkObj = _link as LinkDocument;
				// Here is where we run the machine and do all the logic based on the state
				linkService = createLinkMachineService(_link.state);
				linkSub = linkService.subscribe((state) => {
					linkState = state;
					if (state.matches('claimed.canCall')) initVC();
				});
			}
		});

		_db.feedbacks
			.findOne(feedbackObj._id)
			.exec()
			.then((_feedback) => {
				if (_feedback) {
					feedback = _feedback as FeedbackDocument;
					feedback.$.subscribe((_feedback) => {
						if (_feedback) {
							feedbackObj = _feedback as FeedbackDocType;
						}
					});
				}
			});
	});

	const requestStream = async () => {
		try {
			us = await userStream();
			us.mediaStream.subscribe((stream) => {
				if (stream) {
					mediaStream = stream;
					userstream = true;
				} else {
					userstream = false;
				}
			});
		} catch (e) {
			userstream = false;
		}
	};

	const initVC = () => {
		import('$lib/util/videoCall').then((_vc) => {
			//TODO: Should we wait until call is paid to connect?  Or connect early to check for errors?
			videoCall = _vc.videoCall;
			vc = videoCall();
			vc.callState.subscribe((state) => {
				callState = state;
			});
		});
	};

	const call = async () => {
		if (vc) {
			vc.makeCall(linkObj.callId!, 'Dr. Huge Mongus', mediaStream);
		}
	};

	const sendTransaction = async (amount: number, fundingAddress: string) => {
		// if ($selectedAccount) {
		// 	const result = await $web3.eth.sendTransaction({
		// 		from: $selectedAccount,
		// 		to: fundingAddress,
		// 		value: $web3.utils.toWei(amount.toString(), 'ether')
		// 	});
		// }
	};

	const pay = () => {
		sendTransaction(linkObj.requestedAmount, linkObj.fundingAddress);
	};

	// All depends on the link status
	// Wait for onMount to grab user Stream only if we plan to call or do we grab to to make sure it works?
	onMount(async () => {
		requestStream();
	});
</script>

<FeedbackForm {showFeedback} />

<div class="min-h-full">
	<main class="py-6">
		{#if !inCall}
			<!-- Page header -->
			<div class="text-center">
				<h1 class="font-bold text-center text-5xl">Make your pCall</h1>
				<p class="py-6">Scis vis facere illud pCall. Carpe florem et fac quod nunc vocant.</p>
			</div>
			<div
				class="container	 mx-auto max-w-max  items-center sm:px-6 md:flex md:space-x-5 md:items-stretch  lg:px-8"
			>
				<div class="rounded-box h-full bg-base-200">
					<div>
						<LinkDetail link={linkObj} />
					</div>

					<!-- Link Claim -->
					{#if linkState.can({ type: 'CLAIM', claim: undefined })}
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Claim pCall Link</h2>
								<div class="flex flex-col text-white p-2 justify-center items-center">
									<form method="post" action="?/claim" use:enhance>
										<div class="max-w-xs w-full py-2 form-control ">
											<!-- svelte-ignore a11y-label-has-associated-control -->
											<label for="caller" class="label">
												<span class="label-text">Name you want shown</span></label
											>
											<div class="rounded-md shadow-sm mt-1 relative">
												<input
													name="caller"
													type="text"
													class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
													value={form?.caller ?? ''}
												/>
												{#if form?.missingCaller}<div class="shadow-lg alert alert-error">
														Name is required
													</div>{/if}
											</div>
										</div>
										<div class="max-w-xs w-full py-2 form-control ">
											<!-- svelte-ignore a11y-label-has-associated-control -->
											<label for="pin" class="label">
												<span class="label-text">8 Digit Pin</span></label
											>
											<div class="rounded-md shadow-sm mt-1 relative">
												<input
													name="pin"
													type="text"
													class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
													value={form?.pin ?? ''}
													minlength="8"
													maxlength="8"
												/>
												{#if form?.missingPin}<div class="shadow-lg alert alert-error">
														Pin is required
													</div>{/if}
											</div>
										</div>
										<div class="py-4">
											<button class="btn btn-secondary" type="submit">Claim Link</button>
										</div>
									</form>
								</div>
							</div>
						</div>

						<!-- Link Transaction -->
					{:else if linkState.matches('claimed.waiting4Funding')}
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Fund pCall Link</h2>
								<div class="flex flex-col text-white p-2 justify-center items-center">
									<form method="post" action="?/payment_sent" use:enhance>
										<div class="max-w-xs w-full py-2 form-control ">
											<!-- svelte-ignore a11y-label-has-associated-control -->
											<label for="amount" class="label">
												<span class="label-text">Amount</span></label
											>
											<div class="rounded-md shadow-sm mt-1 relative">
												<input
													name="amount"
													type="text"
													class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
													value={form?.amount ?? ''}
												/>
												{#if form?.missingAmount}<div class="shadow-lg alert alert-error">
														Amount is required
													</div>{/if}
												{#if form?.invalidAmount}<div class="shadow-lg alert alert-error">
														Invalid Amount
													</div>{/if}
											</div>
										</div>
										<div class="py-4">
											<button class="btn btn-secondary" type="submit">Send Payment</button>
										</div>
									</form>
								</div>
							</div>
						</div>
						<!-- Call -->
					{:else}
						<div class="text-center pb-6  w-full">
							<button
								class="btn btn-secondary"
								on:click={call}
								disabled={!callState.matches('ready4Call') || !userstream}
							>
								Call {linkObj.talentInfo.name} Now</button
							>
						</div>
					{/if}
				</div>
				<div class="bg-base-200  text-white card lg:min-w-200">
					<div class="text-center card-body items-center ">
						<div class="text-2xl card-title">Your Video Preview</div>
						<div class="container h-full rounded-2xl max-w-2xl">
							{#if userstream}
								<VideoPreview {us} />
							{:else}
								<div class="text-center">
									<p class="text-center">
										<span class="text-lg">
											You need to allow access to your camera and microphone to use this feature.
										</span>
										<br />
										<span class="text-lg">
											If you want to be able to send your video, you will need to reload this page
											and give permission to use your microphone and camera. You will not be able to
											make a call until you do this.
										</span>
									</p>
								</div>
							{/if}
						</div>
						Call State: {callState.value}
					</div>
				</div>
			</div>
		{:else}
			<VideoCall {vc} {us} />
		{/if}
	</main>
</div>

<div class="flex w-full place-content-center">
	<div class="bg-primary shadow text-primary-content  stats stats-vertical lg:stats-horizontal">
		<div class="stat">
			<div class="stat-title">Views</div>
			<div class="stat-value">{feedbackObj.viewed}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Rejected</div>
			<div class="stat-value">{feedbackObj.rejected}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Disconnected</div>
			<div class="stat-value">{feedbackObj.disconnected}</div>
		</div>
		<div class="stat">
			<div class="stat-title">UnAnswered</div>
			<div class="stat-value">{feedbackObj.unanswered}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Call State</div>
			<div class="stat-value">{callState.value}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Link State</div>
			<div class="stat-value">{JSON.stringify(linkState.value)}</div>
		</div>
	</div>
</div>
