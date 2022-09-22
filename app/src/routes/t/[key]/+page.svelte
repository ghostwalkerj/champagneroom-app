<script lang="ts">
	import { browser } from '$app/environment';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import VideoCall from '$lib/components/calls/VideoCall.svelte';
	import VideoPreview from '$lib/components/calls/VideoPreview.svelte';
	import ProfilePhoto from '$lib/components/forms/ProfilePhoto.svelte';
	import { talentDB, type TalentDBType } from '$lib/ORM/dbs/talentDB';
	import type { LinkDocType, LinkDocument } from '$lib/ORM/models/link';
	import type { TalentDocType, TalentDocument } from '$lib/ORM/models/talent';
	import { StorageTypes } from '$lib/ORM/rxdb';
	import { DEFAULT_PROFILE_IMAGE } from '$lib/util/constants';
	import { userStream, type UserStreamType } from '$lib/util/userStream';
	import type { VideoCallType } from '$lib/util/videoCall';
	import { onDestroy, onMount } from 'svelte';
	import { PhoneIncomingIcon } from 'svelte-feather-icons';
	import { createForm } from 'svelte-forms-lib';
	import StarRating from 'svelte-star-rating';
	import * as yup from 'yup';
	import type { PageData } from './$types';
	import LinkViewer from './LinkView.svelte';
	import TalentActivity from './TalentActivity.svelte';
	import TalentWallet from './TalentWallet.svelte';

	export let data: PageData;

	const token = data.token;
	let talentObj = data.talent as TalentDocType;
	let completedCalls = data.completedCalls as LinkDocType[];
	let currentLink: LinkDocument;

	let key = $page.params.key;
	let vc: VideoCallType;
	//let global = globalThis;

	let talent: TalentDocument;

	if (browser) {
		global = window;
		import('$lib/util/videoCall').then((_vc) => {
			videoCall = _vc.videoCall;
		});
		talentDB(token, key, StorageTypes.IDB).then((db: TalentDBType) => {
			db.talents.findOne(talentObj._id).$.subscribe((_talent) => {
				if (_talent) {
					talentObj = _talent;
					talent = _talent;
					talent.populate('currentLink').then((cl) => {
						if (cl) {
							currentLink = cl;
							initVC();
						}
					});
				}
			});
		});
	}
	const updateProfileImage = async (url: string) => {
		if (url && talent) {
			talent.update!({
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

	let us: Awaited<UserStreamType>;
	$: callState = 'disconnected';
	let videoCall: any;
	let mediaStream: MediaStream;
	$: showAlert = callState == 'receivingCall';
	$: inCall = callState == 'connectedAsReceiver';

	const answerCall = () => {
		showAlert = false;
		vc.acceptCall(mediaStream);
	};

	$: callerName = '';

	const initVC = () => {
		if (vc) vc.destroy();
		if (currentLink) {
			vc = videoCall(currentLink.callId);
			vc.callState.subscribe((cs) => {
				if (cs) callState = cs;
			});
			vc.callerName.subscribe((name) => {
				if (name) callerName = name;
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

	const { form, errors, handleChange, handleSubmit, handleReset } = createForm({
		initialValues: { amount: '0' },
		validationSchema: yup.object({
			amount: yup
				.string()
				.matches(/^[1-9]\d{0,3}$/, 'Must be between $1 and $9999')
				.required()
		}),
		onSubmit: (values) => {
			if (talent)
				talent.createLink(Number.parseInt(values.amount)).then((cl) => {
					currentLink = cl;
					initVC();
				});
			handleReset();
		}
	});
</script>

{#if talentObj}
	<!-- Put this part before </body> tag -->
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
							<LinkViewer link={currentLink} talent={talentObj} />
						</div>

						<!-- Link Form-->
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Create a New pCall Link</h2>
								<div class="flex flex-col text-white p-2 justify-center items-center">
									<form on:submit|preventDefault={handleSubmit}>
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
													id="amount"
													class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
													placeholder="0.00"
													aria-describedby="price-currency"
													on:change={handleChange}
													bind:value={$form.amount}
												/>
												<div
													class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none"
												>
													<span class="text-gray-500 sm:text-sm" id="price-currency"> USDC </span>
												</div>
											</div>
										</div>
										{#if $errors.amount}
											<div class="shadow-lg alert alert-error">{$errors.amount}</div>
										{/if}
										<div class="py-4">
											<button class="btn btn-secondary" type="submit">Generate Link</button>
										</div>
									</form>
								</div>
							</div>
						</div>

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
									<h2 class="text-2xl card-title">pCall Status</h2>
									{#if callState == 'ready'}
										<div class="text-2xl">Waiting for Incoming Call</div>
									{:else}
										<p>Signed in as {talentObj.name}</p>
									{/if}
									<p>Call State: {callState}</p>
								</div>
							</div>
						</div>
						<div>
							<!-- Photo -->
							<div class="lg:col-start-3 lg:col-span-1">
								<div class="bg-primary text-primary-content card">
									<div class="text-center card-body items-center">
										<h2 class="text-2xl card-title">Profile Photo</h2>
										<div>
											<ProfilePhoto
												profileImage={talentObj.profileImageUrl || DEFAULT_PROFILE_IMAGE}
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
										<StarRating rating={talentObj.stats.ratingAvg || 0} />
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
{/if}
