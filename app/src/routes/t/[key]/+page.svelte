<script lang="ts">
	import { browser } from '$app/environment';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { PUBLIC_DEFAULT_PROFILE_IMAGE } from '$env/static/public';
	import VideoCall from '$lib/components/calls/VideoCall.svelte';
	import VideoPreview from '$lib/components/calls/VideoPreview.svelte';
	import ProfilePhoto from '$lib/components/forms/ProfilePhoto.svelte';
	import { callMachine } from '$lib/machines/callMachine';
	import { createLinkMachineService, type LinkMachineServiceType } from '$lib/machines/linkMachine';
	import { talentDB, type TalentDBType } from '$lib/ORM/dbs/talentDB';
	import type { LinkDocType, LinkDocument } from '$lib/ORM/models/link';
	import type { TalentDocType, TalentDocument } from '$lib/ORM/models/talent';
	import { StorageTypes } from '$lib/ORM/rxdb';
	import { currencyFormatter } from '$lib/util/constants';
	import { userStream, type UserStreamType } from '$lib/util/userStream';
	import type { VideoCallType } from '$lib/util/videoCall';
	import { onDestroy, onMount } from 'svelte';
	import { PhoneIncomingIcon } from 'svelte-feather-icons';
	import StarRating from 'svelte-star-rating';
	import type { Subscription } from 'xstate';
	import type { PageData } from './$types';
	import LinkViewer from './LinkView.svelte';
	import TalentActivity from './TalentActivity.svelte';
	import TalentWallet from './TalentWallet.svelte';
	export let form: import('./$types').ActionData;

	export let data: PageData;
	const token = data.token;

	let talentObj = data.talent as TalentDocType;
	let completedCalls = data.completedCalls as LinkDocType[];
	let currentLink = data.currentLink as LinkDocument;
	let key = $page.params.key;
	let vc: VideoCallType;
	let talent: TalentDocument;
	let linkService: LinkMachineServiceType;
	let linkSub: Subscription;

	$: ready4Call = false;
	$: showAlert = false;
	$: inCall = false;
	let us: Awaited<UserStreamType>;
	let callState = callMachine.initialState;
	let mediaStream: MediaStream;
	$: callerName = '';
	let videoCall: any;
	let currentLinkState = currentLink
		? createLinkMachineService(currentLink.state).getSnapshot()
		: undefined;
	$: canCancelLink = currentLinkState
		? currentLinkState.can({
				type: 'REQUEST CANCELLATION',
				cancel: undefined
		  })
		: false;

	$: canCreateLink = currentLinkState ? currentLinkState.done : true;
	$: canCall = currentLinkState ? currentLinkState.matches('claimed.canCall') : false;
	$: submitDisabled = false;

	const updateLink = (linkState: LinkDocument['state']) => {
		if (currentLink && currentLink.atomicPatch)
			currentLink.atomicPatch({
				updatedAt: new Date().getTime(),
				state: linkState
			});
	};

	talentDB(token, key, StorageTypes.IDB).then((db: TalentDBType) => {
		db.talents
			.findOne(talentObj._id)
			.exec()
			.then((_talent) => {
				if (_talent) {
					talentObj = _talent;
					talent = _talent;
					talent.get$('currentLink').subscribe((linkId) => {
						if (linkId) {
							startLinkMachine(db, linkId);
						}
					});
				}
			});
	});

	const startLinkMachine = (db: TalentDBType, linkId: string) => {
		if (linkService) linkService.stop();
		if (linkSub) linkSub.unsubscribe();
		db.links
			.findOne(linkId)
			.exec()
			.then((link) => {
				if (link) {
					link.$.subscribe((_link) => {
						submitDisabled = false; // link changed, so can submit again
						currentLink = _link;
						linkService = createLinkMachineService(currentLink.state, updateLink);
						linkSub = linkService.subscribe((state) => {
							currentLinkState = state;
							if (state.changed) {
								canCancelLink = state.can({
									type: 'REQUEST CANCELLATION',
									cancel: undefined
								});
								canCreateLink = state.done ?? true;
								canCall = state.matches('claimed.canCall');
								if (canCall) initVC();
							}
						});
					});
				}
			});
	};

	const updateProfileImage = async (url: string) => {
		if (url && talent) {
			talent.update({
				$set: {
					profileImageUrl: url,
					updatedAt: new Date().getTime()
				}
			});
			if (currentLink) {
				currentLink.update({
					$set: {
						talentInfo: {
							...currentLink.talentInfo,
							profileImageUrl: url
						},
						updatedAt: new Date().getTime()
					}
				});
			}
		}
	};

	const answerCall = () => {
		showAlert = false;
		vc.acceptCall(mediaStream);
	};

	const initVC = () => {
		if (browser) {
			global = window;
			import('$lib/util/videoCall').then((_vc) => {
				videoCall = _vc.videoCall;

				if (vc) vc.destroy();
				if (currentLink) {
					vc = videoCall(currentLink.callId);
					vc.callState.subscribe((cs) => {
						if (cs) {
							callState = cs;
							showAlert = callState.matches('receivingCall');
							inCall = callState.matches('inCall');
							ready4Call = callState.matches('ready4Call');
						}
					});
					vc.callerName.subscribe((name) => {
						if (name) callerName = name;
					});
				}
			});
		}
	};

	onMount(async () => {
		us = await userStream();
		us.mediaStream.subscribe((stream) => {
			if (stream) mediaStream = stream;
		});
	});

	onDestroy(async () => {
		if (vc) vc.destroy();
	});
</script>

<input type="checkbox" id="call-modal" class="modal-toggle" bind:checked={showAlert} />
<div class="modal">
	<div class="modal-box">
		<div class="flex flex-row pt-4 gap-2 place-items-center justify-between">
			<div class="font-bold text-lg  ">Incoming pCall</div>
			<div class="h-14 animate-shock animate-loop w-14 animated  btn btn-circle ">
				<PhoneIncomingIcon size="34" />
			</div>
		</div>
		<p class="py-4">
			You have an incoming pCall from <span class="font-bold">{callerName}</span>
		</p>
		<div class="modal-action">
			<!-- svelte-ignore a11y-click-events-have-key-events -->
			<label for="call-modal" class="btn" on:click={answerCall}>Answer</label>
		</div>
	</div>
</div>

<div class="min-h-full">
	<main class="py-10">
		<!-- Page header -->
		<div
			class="mx-auto max-w-3xl px-4 sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:max-w-7xl lg:px-8"
		>
			<div class="flex space-x-5 items-center">
				<div>
					<h1 class="font-bold text-5xl">Request a pCall</h1>
					<p class="pt-6">
						Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam. Posuit eam ad opus nunc
						et adepto a pCall!
					</p>
				</div>
			</div>
		</div>
		{#if !inCall}
			<div
				class="mx-auto mt-8 max-w-3xl grid gap-6 grid-cols-1 sm:px-6 lg:max-w-7xl lg:grid-flow-col-dense lg:grid-cols-3"
			>
				<div class="space-y-6 lg:col-start-1 lg:col-span-2">
					<!-- Current Link -->
					<div>
						<LinkViewer link={currentLink} talent={talentObj} linkState={currentLinkState} />
					</div>

					{#if canCancelLink}
						<!-- Link Form-->
						<form
							method="post"
							action="?/cancel_link"
							on:submit={() => (submitDisabled = true)}
							use:enhance
						>
							<div class="bg-primary text-primary-content card">
								<div class="text-center card-body items-center">
									<div class="text-2xl card-title">Cancel Your pCall Link</div>
									<div class="text xl">
										If you cancel this pCall link, the link will be deactivated and nobody can use
										it to call.
									</div>
									{#if currentLink.state.claim && currentLink.state.totalFunding > 0}
										{currencyFormatter.format(currentLink.state.totalFunding)} will be refunded to "{currentLink
											.state.claim.caller}"
									{/if}

									<div class="flex flex-col text-white p-2 justify-center items-center">
										<div class="py-4">
											<button class="btn btn-secondary" type="submit" disabled={submitDisabled}
												>Cancel Link</button
											>
										</div>
									</div>
								</div>
							</div>
						</form>
					{:else if canCreateLink}
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Create a New pCall Link</h2>
								<div class="flex flex-col text-white p-2 justify-center items-center">
									<form
										method="post"
										action="?/create_link"
										on:submit={() => (submitDisabled = true)}
										use:enhance
									>
										<div class="max-w-xs w-full py-2 form-control ">
											<!-- svelte-ignore a11y-label-has-associated-control -->
											<label for="price" class="label">
												<span class="label-text">Requested Amount in USD</span></label
											>
											<div class="rounded-md shadow-sm mt-1 relative">
												<div
													class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none"
												>
													<span class="text-gray-500 sm:text-sm"> $ </span>
												</div>
												<input
													type="text"
													name="amount"
													class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
													placeholder="0.00"
													aria-describedby="price-currency"
													value={form?.amount ?? ''}
												/>
												<div
													class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none"
												>
													<span class="text-gray-500 sm:text-sm" id="price-currency"> USDC </span>
												</div>
											</div>
											{#if form?.missingAmount}<div class="shadow-lg alert alert-error">
													Amount is required
												</div>{/if}
											{#if form?.invalidAmount}<div class="shadow-lg alert alert-error">
													Invalid Amount
												</div>{/if}
										</div>

										<div class="py-4">
											<button class="btn btn-secondary" type="submit" disabled={submitDisabled}
												>Generate Link</button
											>
										</div>
									</form>
								</div>
							</div>
						</div>
					{:else if currentLinkState && currentLinkState.matches('claimed.requestedCancellation.waiting4Refund')}
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Issue Refund for Cancelled Link</h2>
								<div class="flex flex-col text-white p-2 justify-center items-center">
									<form
										method="post"
										action="?/send_refund"
										on:submit={() => (submitDisabled = true)}
										use:enhance
									>
										<div class="max-w-xs w-full py-2 form-control ">
											<!-- svelte-ignore a11y-label-has-associated-control -->
											<label for="price" class="label">
												<span class="label-text"
													>Refund {currentLink.state.claim && currentLink.state.claim.caller}</span
												></label
											>
											<div class="rounded-md shadow-sm mt-1 relative">
												<div
													class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none"
												>
													<span class="text-gray-500 sm:text-sm"> $ </span>
												</div>
												<input
													type="text"
													name="amount"
													class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
													placeholder="0.00"
													aria-describedby="price-currency"
													value={form?.amount ?? ''}
												/>
												<div
													class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none"
												>
													<span class="text-gray-500 sm:text-sm" id="price-currency"> USDC </span>
												</div>
											</div>
											{#if form?.missingAmount}<div class="shadow-lg alert alert-error">
													Amount is required
												</div>{/if}
											{#if form?.invalidAmount}<div class="shadow-lg alert alert-error">
													Invalid Amount
												</div>{/if}
										</div>

										<div class="py-4">
											<button class="btn btn-secondary" type="submit" disabled={submitDisabled}
												>Send Refund</button
											>
										</div>
									</form>
								</div>
							</div>
						</div>
					{/if}

					<!-- Camera  Preview -->
					<div class="bg-primary text-primary-content card">
						<div class="text-center card-body items-center">
							<h2 class="text-2xl card-title">Your Video Preview</h2>
							<div class="rounded-2xl">
								<VideoPreview {us} />
							</div>
						</div>
					</div>
				</div>

				<!--Next Column-->
				<div class="space-y-6 lg:col-start-3 lg:col-span-1">
					<!-- Status -->
					<div class="lg:col-start-3 lg:col-span-1">
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Call Status</h2>
								{#if ready4Call}
									<div class="text-2xl">Waiting for Incoming Call</div>
								{:else}
									<p>Signed in as {talentObj.name}</p>
								{/if}
								<p>Call State: {callState.value}</p>
							</div>
						</div>
					</div>
					<!-- Photo -->
					<div>
						<div class="lg:col-start-3 lg:col-span-1">
							<div class="bg-primary text-primary-content card">
								<div class="text-center card-body items-center">
									<h2 class="text-3xl card-title">{talentObj.name}</h2>
									<div>
										<ProfilePhoto
											profileImage={talentObj.profileImageUrl || PUBLIC_DEFAULT_PROFILE_IMAGE}
											callBack={(value) => {
												updateProfileImage(value);
											}}
										/>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Wallet -->
					<div>
						<TalentWallet {talent} />
					</div>

					<!-- Feedback -->
					<div>
						<div class="lg:col-start-3 lg:col-span-1">
							<div class="bg-primary text-primary-content card">
								<div class="text-center card-body items-center">
									<h2 class="text-2xl card-title">Your Average Rating</h2>
									{talentObj.stats.ratingAvg.toFixed(2)}
									<StarRating rating={talentObj.stats.ratingAvg ?? 0} />
								</div>
							</div>
						</div>
					</div>

					<!-- Activity Feed -->
					<div>
						<div class="lg:col-start-3 lg:col-span-1">
							<TalentActivity {completedCalls} />
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div>
				<VideoCall {vc} {us} options={{ hangup: false, cam: false, mic: false }} />
			</div>
		{/if}
	</main>
</div>
