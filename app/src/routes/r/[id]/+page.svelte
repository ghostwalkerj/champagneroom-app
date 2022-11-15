<script lang="ts">
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { page } from '$app/stores';
	import VideoCall from '$lib/components/calls/VideoCall.svelte';
	import VideoPreview from '$lib/components/calls/VideoPreview.svelte';
	import { callMachine } from '$lib/machines/callMachine';
	import { createLinkMachineService } from '$lib/machines/linkMachine';
	import { publicDB, type PublicDBType } from '$lib/ORM/dbs/publicDB';
	import type { LinkDocument } from '$lib/ORM/models/link';
	import { StorageTypes } from '$lib/ORM/rxdb';
	import { currencyFormatter } from '$lib/util/constants';
	import getProfileImage from '$lib/util/profilePhoto';
	import { userStream, type UserStreamType } from '$lib/util/userStream';
	import type { VideoCallType } from '$lib/util/videoCall';
	import { onMount } from 'svelte';
	import { PhoneOutgoingIcon } from 'svelte-feather-icons';
	import type { PageData } from './$types';
	import FeedbackForm from './FeedbackForm.svelte';
	import LinkDetail from './LinkDetail.svelte';

	export let form: import('./$types').ActionData;
	export let data: PageData;

	const token = data.token;
	let linkObj = data.link;
	let displayName = data.displayName;
	let linkId = $page.params.id;
	let vc: VideoCallType;
	let videoCall: any;
	let mediaStream: MediaStream;
	let us: Awaited<UserStreamType>;

	$: waiting4StateChange = false;
	$: linkService = createLinkMachineService(linkObj.linkState);
	$: linkMachineState = linkService.initialState;
	$: showFeedback = false;
	$: inCall = false;
	$: callState = callMachine.initialState;
	$: userstream = false;
	$: profileImage = getProfileImage(displayName);
	$: showCallModal = false;

	publicDB(token, linkId, StorageTypes.IDB).then((db: PublicDBType) => {
		db.links.findOne(linkId).$.subscribe((link) => {
			if (link) {
				// Here is where we run the machine and do all the logic based on the state
				if (link.linkState.updatedAt > linkObj.linkState.updatedAt) {
					linkService = createLinkMachineService(link.linkState);
					linkService.subscribe((state) => {
						linkMachineState = state;
					});
				}
				linkObj = link as LinkDocument;
				waiting4StateChange = false;
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
		if (browser) {
			import('$lib/util/videoCall').then((_vc) => {
				//TODO: Should we wait until call is paid to connect?  Or connect early to check for errors?
				videoCall = _vc.videoCall;
				vc = videoCall();
				vc.callState.subscribe((state) => {
					callState = state;
					console.log('callState', JSON.stringify(callState.value));
					inCall = callState.matches('inCall');
					showCallModal = callState.matches('makingCall');
				});
			});
		}
	};

	const call = async () => {
		if (vc) {
			vc.makeCall(linkObj.callId, linkObj.linkState.claim?.caller ?? 'Anonymous', mediaStream);
		}
	};

	const onSubmit = ({ form }) => {
		waiting4StateChange = true;
		return async ({ result }) => {
			if (result.type !== 'success') {
				waiting4StateChange = false;
			} else {
				if (form) form.reset();
			}
			await applyAction(result);
		};
	};

	const cancelCall = () => {
		if (vc) {
			vc.cancelCall();
		}
	};

	// Wait for onMount to grab user Stream only if we plan to call or do we grab to to make sure it works?
	onMount(async () => {
		requestStream();
		initVC();
	});
</script>

<input type="checkbox" id="outgoingcall-modal" class="modal-toggle" bind:checked={showCallModal} />
<div class="modal">
	<div class="modal-box">
		<div class="flex flex-row pt-4 gap-2 place-items-center justify-between">
			<div class="font-bold text-lg  ">Making pCall</div>
			<div class="h-14 animate-shock animate-loop w-14 animated  btn btn-circle ">
				<PhoneOutgoingIcon size="34" />
			</div>
		</div>
		<p class="py-4">
			You are calling <span class="font-bold">{linkObj.talentInfo.name}</span>
		</p>
		<div class="modal-action">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<label for="call-modal" class="btn" on:click={cancelCall}>Cancel</label>
		</div>
	</div>
</div>

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
					{#if linkMachineState.done}
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">This Link is No Longer Active</h2>
							</div>
						</div>
					{:else if linkMachineState.matches('claimed.requestedCancellation.waiting4Refund')}
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">
									This Link has been Cancelled. Refund is pending.
								</h2>
								<div>Refunded Amount</div>
								<div>{currencyFormatter.format(linkObj.linkState.refundedAmount)}</div>
							</div>
						</div>
					{:else if linkMachineState.can({ type: 'CLAIM', claim: undefined })}
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Claim pCall Link</h2>
								<div class="flex flex-col text-white p-2 justify-center items-center">
									<div
										class="bg-cover items-center bg-no-repeat rounded-full h-48 w-48"
										style="background-image: url('{profileImage}')"
									/>
									<form method="post" action="?/claim" use:enhance={onSubmit}>
										<div class="max-w-xs w-full py-2 form-control ">
											<!-- svelte-ignore a11y-label-has-associated-control -->
											<label for="caller" class="label">
												<span class="label-text">Your Display Name</span></label
											>
											<div class="rounded-md shadow-sm mt-1 relative">
												<input
													name="caller"
													type="text"
													class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
													bind:value={displayName}
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
													class="max-w-xs w-full py-2 pl-6 input input-bordered input-primary"
													value={form?.pin ?? ''}
													minlength="8"
													maxlength="8"
												/>
												{#if form?.missingPin}<div class="shadow-lg alert alert-error">
														Pin is required
													</div>{/if}
												{#if form?.invalidPin}<div class="shadow-lg alert alert-error">
														Pin must be 8 digits
													</div>{/if}
											</div>
										</div>
										<div class="py-4">
											<button class="btn btn-secondary" type="submit" disabled={waiting4StateChange}
												>Claim Link</button
											>
										</div>
									</form>
								</div>
							</div>
						</div>

						<!-- Link Transaction -->
					{:else if linkMachineState.matches('claimed.waiting4Funding')}
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Fund pCall Link</h2>
								<div class="flex flex-col text-white p-2 justify-center items-center">
									<form method="post" action="?/send_payment" use:enhance={onSubmit}>
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
											<button class="btn btn-secondary" type="submit" disabled={waiting4StateChange}
												>Send Payment</button
											>
										</div>
									</form>
								</div>
							</div>
						</div>
						<!-- Call -->
					{:else if linkMachineState.matches('claimed.canCall')}
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
