<script type="ts">
	import { reporter, ValidationMessage } from '@felte/reporter-svelte';
	import { validator } from '@felte/validator-zod';
	import { useQueryClient } from '@sveltestack/svelte-query';
	import LinkViewer from 'components/LinkViewer.svelte';
	import VideoCall from 'components/VideoCall.svelte';
	import VideoPreview from 'components/VideoPreview.svelte';
	import { linkSchema, type LinkDocumentType } from 'db/models/link';
	import { getLinkQueryByAddress } from 'db/queries/linkQueries';
	import { createForm } from 'felte';
	import { userStream, type UserStreamType } from 'lib/userStream';
	import type { VideoCallType } from 'lib/videoCall';
	import { onMount } from 'svelte';
	import { PhoneIncomingIcon } from 'svelte-feather-icons';
	import { selectedAccount } from 'svelte-web3';

	const queryClient = useQueryClient();

	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});

	let address = '';

	const { form, reset } = createForm({
		extend: [
			reporter,
			validator({
				schema: linkSchema
			})
		],
		async onSuccess(response: any) {
			const body: {
				success: boolean;
				linkDocument: LinkDocumentType;
			} = await response.json();
			if (body.success) {
				queryClient.setQueryData(['linkDocument', address], body);
			}
			reset();
		},
		onerror(err: any) {
			console.log(err);
		}
	});

	let vc: VideoCallType;
	let us: Awaited<UserStreamType>;
	let callState: typeof vc.callState;
	let videoCall;
	let mediaStream: MediaStream;

	onMount(async () => {
		us = await userStream();
		videoCall = (await import('lib/videoCall')).videoCall;
		us.mediaStream.subscribe((stream) => {
			if (stream) mediaStream = stream;
		});
	});

	selectedAccount.subscribe((account) => {
		if (account) {
			address = account;
		}
	});

	$: linkQueryResult = getLinkQueryByAddress(address);
	$: userName = $linkQueryResult.data?.linkDocument?.name || '';
	$: callerName = '';

	$: if (address && userName && videoCall) {
		vc = videoCall(address, userName);
		callState = vc.callState;
		vc.callerName.subscribe((name) => {
			if (name) callerName = name;
		});
	}
	$: showAlert = $callState == 'receivingCall';
	$: inCall = $callState == 'connectedAsReceiver';

	const answerCall = () => {
		showAlert = false;
		vc.acceptCall(mediaStream);
	};
</script>

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

					{#if $linkQueryResult && $linkQueryResult.isSuccess}
						<section aria-labelledby="link-information-tile">
							<div><LinkViewer linkDocument={$linkQueryResult.data.linkDocument} /></div>
						</section>
					{/if}

					<!-- Link Form-->
					<section aria-labelledby="new-link-tile">
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Request a New pCall</h2>

								<div class="flex flex-col text-white p-2 justify-center items-center">
									<form use:form method="post">
										<input type="hidden" name="address" id="address" value={address} />
										<div class="max-w-xs w-full py-2 form-control">
											<!-- svelte-ignore a11y-label-has-associated-control -->
											<label class="label">
												<span class="label-text">Name to Show Caller</span>
											</label>
											<input
												type="text"
												id="name"
												name="name"
												placeholder="Enter a name"
												class="max-w-xs w-full py-2 input input-bordered input-primary"
											/>
											<ValidationMessage for="name" let:messages={message}>
												<span>{message}</span>
												<span slot="placeholder" />
											</ValidationMessage>
										</div>
										<div class="max-w-xs w-full py-2 form-control ">
											<!-- svelte-ignore a11y-label-has-associated-control -->
											<label for="price" class="label">
												<span class="label-text"> Requested Amount in USD</span></label
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
												/>
												<div
													class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none"
												>
													<span class="text-gray-500 sm:text-sm" id="price-currency"> USDC </span>
												</div>
											</div>

											<ValidationMessage for="amount" let:messages={message}>
												<span>{message}</span>
												<span slot="placeholder" />
											</ValidationMessage>
										</div>
										<div class="py-4">
											<button class="btn btn-secondary" type="submit">Generate Link</button>
										</div>
									</form>
								</div>
							</div>
						</div>
					</section>

					<!-- Camera  Preview -->
					<section aria-labelledby="new-link-tile">
						<div class="bg-primary text-primary-content card">
							<div class="text-center card-body items-center">
								<h2 class="text-2xl card-title">Your Video Preview</h2>
								<div class="rounded-2xl">
									<VideoPreview {us} />
								</div>
							</div>
						</div>
					</section>
				</div>
				<!--Next Column-->
				<div class="space-y-6 lg:col-start-3 lg:col-span-1">
					<div>
						<!-- Status -->
						<section aria-labelledby="status-title" class="lg:col-start-3 lg:col-span-1">
							<div class="bg-primary text-primary-content card">
								<div class="text-center card-body items-center">
									<h2 class="text-2xl card-title">pCall Status</h2>
									<p>Signed in as {userName}</p>
									<p>Call Status: {$callState}</p>
								</div>
							</div>
						</section>
					</div>
					<div>
						<!-- Account -->
						<section aria-labelledby="account-title" class="lg:col-start-3 lg:col-span-1">
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
						</section>
					</div>
					<div>
						<!-- Activity Feed -->
						<section aria-labelledby="activity-title" class="lg:col-start-3 lg:col-span-1">
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
																class="rounded-full flex bg-green-500 h-8 ring-white ring-8 w-8 items-center justify-center"
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
																	You recieved feedback from <span class="font-medium text-gray-900"
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
																class="rounded-full flex bg-green-500 h-8 ring-white ring-8 w-8 items-center justify-center"
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
																class="rounded-full flex bg-green-500 h-8 ring-white ring-8 w-8 items-center justify-center"
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
																class="rounded-full flex bg-green-500 h-8 ring-white ring-8 w-8 items-center justify-center"
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
																class="rounded-full flex bg-green-500 h-8 ring-white ring-8 w-8 items-center justify-center"
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
						</section>
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
