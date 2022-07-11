<script type="ts">
	import { browser } from '$app/env';
	import { page } from '$app/stores';
	import { gun } from 'db';
	import { createForm } from 'svelte-forms-lib';
	import * as yup from 'yup';

	import ProfilePhoto from 'components/forms/ProfilePhoto.svelte';
	import LinkViewer from 'components/LinkViewer.svelte';
	import VideoCall from 'components/VideoCall.svelte';
	import VideoPreview from 'components/VideoPreview.svelte';

	import { createLink, LinkById, LinkSchema, LinkStatus, type Link } from 'db/models/link';
	import { TalentByKey, type Talent } from 'db/models/talent';
	import { userStream, type UserStreamType } from 'lib/userStream';
	import type { VideoCallType } from 'lib/videoCall';
	import { onDestroy, onMount } from 'svelte';
	import { PhoneIncomingIcon } from 'svelte-feather-icons';
	import StarRating from 'svelte-star-rating';

	let key = $page.params.key;
	let linkById = gun.get(LinkById);
	let talent: Talent;
	let currentLink: Link;
	let talentRef = gun.get(TalentByKey).get(key);

	talentRef.on((_talent) => {
		if (_talent) {
			talent = _talent;
			if (talent.currentLinkId) {
				linkById.get(talent.currentLinkId).on((_link: Link) => {
					if (_link) {
						currentLink = _link;
					}
				});
			}
		}
	});

	let vc: VideoCallType;
	if (browser) {
		import('lib/videoCall').then((_vc) => {
			videoCall = _vc.videoCall;
			initVC();
		});
	}
	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	const updateProfileImage = async (url: string) => {
		if (url) {
			talentRef.get('profileImageUrl').put(url);
			talent.profileImageUrl = url;
			if (currentLink) {
				currentLink.profileImageUrl = url;
			}
		}
	};

	let us: Awaited<UserStreamType>;
	$: callState = 'disconnected';
	let videoCall;
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
		const callId = currentLink ? currentLink.callId : null;
		vc = videoCall(callId);
		vc.callState.subscribe((cs) => {
			if (cs) callState = cs;
		});
		vc.callerName.subscribe((name) => {
			if (name) callerName = name;
		});
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
			const linkParams = LinkSchema.cast({
				amount: values.amount,
				talentId: talent._id,
				name: talent.name,
				profileImageUrl: talent.profileImageUrl
			});
			const link = createLink(linkParams);
			if (currentLink) {
				linkById.get(currentLink._id).get('status').put(LinkStatus.EXPIRED);
			}
			linkById.get(link._id).put(link);
			talentRef.get('currentLinkId').put(link._id);
			currentLink = link;
			handleReset();
		}
	});
</script>

{#if talent}
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
							<div>
								{#if currentLink}
									<LinkViewer link={currentLink} {talent} />
								{:else}
									<div class="bg-primary text-primary-content card">
										<div class="text-center card-body items-center">
											<h2 class="text-2xl card-title">You Have No Outstanding pCall Links</h2>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<!-- Link Form-->
						<div>
							<div class="bg-primary text-primary-content card">
								<div class="text-center card-body items-center">
									<h2 class="text-2xl card-title">Request a New pCall</h2>

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
												<div class="alert alert-error shadow-lg">{$errors.amount}</div>
											{/if}
											<div class="py-4">
												<button class="btn btn-secondary" type="submit">Generate Link</button>
											</div>
										</form>
									</div>
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
						<div>
							<!-- Status -->
							<div class="lg:col-start-3 lg:col-span-1">
								<div class="bg-primary text-primary-content card">
									<div class="text-center card-body items-center">
										<h2 class="text-2xl card-title">pCall Status</h2>
										<p>Signed in as {talent.name}</p>
										{#if currentLink}
											<p>CallId: {currentLink.callId}</p>
										{/if}
										<p>Call State: {callState}</p>
									</div>
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
												profileImage={talent.profileImageUrl}
												callBack={(value) => {
													updateProfileImage(value);
												}}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div>
							<!-- Feedback -->
							<div class="lg:col-start-3 lg:col-span-1">
								<div class="bg-primary text-primary-content card">
									<div class="text-center card-body items-center">
										<h2 class="text-2xl card-title">Your Average Rating</h2>
										<StarRating rating={talent.ratingAvg || 0} />
									</div>
								</div>
							</div>
						</div>
						<div>
							<!-- Account -->
							<div class="lg:col-start-3 lg:col-span-1">
								<div class="bg-primary text-primary-content card">
									<div class="text-center card-body items-center">
										<h2 class="text-2xl card-title">Account</h2>
										<div class="flex">
											<div class="stat">
												<div class="stat-title">Amount in Escrow</div>
												<div class="stat-value">{formatter.format(1400)}</div>
											</div>
											<div class="stat">
												<div class="stat-title">Amount Availabe</div>
												<div class="stat-value">{formatter.format(400)}</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
						<div>
							<!-- Activity Feed -->
							<div class="lg:col-start-3 lg:col-span-1">
								<div class="bg-primary text-primary-content card">
									<div class="text-left card-body items-center">
										<h2 class="text-2xl card-title">Activity</h2>

										<div class="mt-6 flow-root">
											<ul class="-mb-8">
												<li>
													<div class="pb-8 relative">
														<span
															class="h-full -ml-px bg-gray-200 top-4 left-4 w-0.5 absolute"
															aria-hidden="true"
														/>
														<div class="flex space-x-5 relative">
															<div>
																<span
																	class="rounded-full flex bg-blue-500 h-8 ring-white ring-8 w-8 items-center justify-center"
																>
																	<!-- Heroicon name: solid/check -->
																	<svg
																		class="h-5 text-white w-5"
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="0 0 20 20"
																		fill="currentColor"
																		aria-hidden="true"
																	>
																		<path
																			fill-rule="evenodd"
																			d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																			clip-rule="evenodd"
																		/>
																	</svg>
																</span>
															</div>
															<div class="flex space-x-4 flex-1 min-w-0 pt-1.5 justify-between">
																<div>
																	<p class="text-sm text-gray-200">
																		Completed pCall with <span class="font-medium text-gray-900"
																			>Ted Cruz</span
																		>
																		for {formatter.format(300)}
																	</p>
																</div>
																<div class="text-right text-sm text-gray-200 whitespace-nowrap">
																	<time datetime="2020-09-28">Sep 28</time>
																</div>
															</div>
														</div>
													</div>
												</li>

												<li>
													<div class="pb-8 relative">
														<span
															class="h-full -ml-px bg-gray-200 top-4 left-4 w-0.5 absolute"
															aria-hidden="true"
														/>
														<div class="flex space-x-5 relative">
															<div>
																<span
																	class="rounded-full flex bg-blue-500 h-8 ring-white ring-8 w-8 items-center justify-center"
																>
																	<!-- Heroicon name: solid/thumb-up -->
																	<svg
																		class="h-5 text-white w-5"
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="0 0 20 20"
																		fill="currentColor"
																		aria-hidden="true"
																	>
																		<path
																			d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"
																		/>
																	</svg>
																</span>
															</div>
															<div class="flex space-x-4 flex-1 min-w-0 pt-1.5 justify-between">
																<div>
																	<p class="text-sm text-gray-100">
																		You recieved feedback from <span
																			class="font-medium text-gray-900"
																			>Ted Cruiz (not related to Ted Cruz)</span
																		>
																	</p>
																</div>
																<div class="text-right text-sm text-gray-100 whitespace-nowrap">
																	<time datetime="2020-09-30">Sep 30</time>
																</div>
															</div>
														</div>
													</div>
												</li>

												<li>
													<div class="pb-8 relative">
														<div class="flex space-x-5 relative">
															<div>
																<span
																	class="rounded-full flex bg-blue-500 h-8 ring-white ring-8 w-8 items-center justify-center"
																>
																	<!-- Heroicon name: solid/check -->
																	<svg
																		class="h-5 text-white w-5"
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="0 0 20 20"
																		fill="currentColor"
																		aria-hidden="true"
																	>
																		<path
																			fill-rule="evenodd"
																			d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																			clip-rule="evenodd"
																		/>
																	</svg>
																</span>
															</div>
															<div class="flex space-x-4 flex-1 min-w-0 pt-1.5 justify-between">
																<div>
																	<p class="text-sm text-gray-200">
																		Completed pCall with <span
																			href="#"
																			class="font-medium text-gray-900">Tedward Cruz</span
																		>
																		for {formatter.format(500)}
																	</p>
																</div>
																<div class="text-right text-sm text-gray-200 whitespace-nowrap">
																	<time datetime="2020-10-04">Oct 4</time>
																</div>
															</div>
														</div>
													</div>
												</li>
												<li>
													<div class="pb-8 relative">
														<div class="flex space-x-5 relative">
															<div>
																<span
																	class="rounded-full flex bg-blue-500 h-8 ring-white ring-8 w-8 items-center justify-center"
																>
																	<!-- Heroicon name: solid/check -->
																	<svg
																		class="h-5 text-white w-5"
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="0 0 20 20"
																		fill="currentColor"
																		aria-hidden="true"
																	>
																		<path
																			fill-rule="evenodd"
																			d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																			clip-rule="evenodd"
																		/>
																	</svg>
																</span>
															</div>
															<div class="flex space-x-4 flex-1 min-w-0 pt-1.5 justify-between">
																<div>
																	<p class="text-sm text-gray-200">
																		Completed pCall with <span
																			href="#"
																			class="font-medium text-gray-900">Zed Cruz</span
																		>
																		for {formatter.format(500)}
																	</p>
																</div>
																<div class="text-right text-sm text-gray-200 whitespace-nowrap">
																	<time datetime="2020-10-04">Oct 4</time>
																</div>
															</div>
														</div>
													</div>
												</li>
												<li>
													<div class="pb-8 relative">
														<div class="flex space-x-5 relative">
															<div>
																<span
																	class="rounded-full flex bg-blue-500 h-8 ring-white ring-8 w-8 items-center justify-center"
																>
																	<!-- Heroicon name: solid/check -->
																	<svg
																		class="h-5 text-white w-5"
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="0 0 20 20"
																		fill="currentColor"
																		aria-hidden="true"
																	>
																		<path
																			fill-rule="evenodd"
																			d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																			clip-rule="evenodd"
																		/>
																	</svg>
																</span>
															</div>
															<div class="flex space-x-4 flex-1 min-w-0 pt-1.5 justify-between">
																<div>
																	<p class="text-sm text-gray-200">
																		Completed pCall with <span
																			href="#"
																			class="font-medium text-gray-900">Ed Cruz</span
																		>
																		for {formatter.format(500)}
																	</p>
																</div>
																<div class="text-right text-sm text-gray-200 whitespace-nowrap">
																	<time datetime="2020-10-04">Oct 4</time>
																</div>
															</div>
														</div>
													</div>
												</li>
												<li>
													<div class="pb-8 relative">
														<div class="flex space-x-5 relative">
															<div>
																<span
																	class="rounded-full flex bg-blue-500 h-8 ring-white ring-8 w-8 items-center justify-center"
																>
																	<!-- Heroicon name: solid/check -->
																	<svg
																		class="h-5 text-white w-5"
																		xmlns="http://www.w3.org/2000/svg"
																		viewBox="0 0 20 20"
																		fill="currentColor"
																		aria-hidden="true"
																	>
																		<path
																			fill-rule="evenodd"
																			d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
																			clip-rule="evenodd"
																		/>
																	</svg>
																</span>
															</div>
															<div class="flex space-x-4 flex-1 min-w-0 pt-1.5 justify-between">
																<div>
																	<p class="text-sm text-gray-200">
																		Completed pCall with <span
																			href="#"
																			class="font-medium text-gray-900">Fred Cruz</span
																		>
																		for {formatter.format(500)}
																	</p>
																</div>
																<div class="text-right text-sm text-gray-200 whitespace-nowrap">
																	<time datetime="2020-10-04">Oct 4</time>
																</div>
															</div>
														</div>
													</div>
												</li>
											</ul>
										</div>
									</div>
								</div>
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
