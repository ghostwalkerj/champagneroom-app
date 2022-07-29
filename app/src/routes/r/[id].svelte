<script context="module">
	import { AUTH_PATH, TokenRoles } from '$lib/constants';

	//TODO: Only return token if link URL is good.
	export async function load({ url, fetch }) {
		const auth_url = urlJoin(url.origin, AUTH_PATH);
		try {
			const res = await fetch(auth_url, {
				method: 'POST',
				body: JSON.stringify({
					tokenRole: TokenRoles.PUBLIC
				})
			});
			const body = await res.json();
			const token = body.token;
			return { props: { token } };
		} catch (e) {
			console.log('Error in link load', e);
		}
	}
</script>

<script type="ts">
	import { browser } from '$app/env';
	import { page } from '$app/stores';
	import LinkFeedback from '$lib/components/Feedback.svelte';
	import LinkDetail from '$lib/components/LinkDetail.svelte';
	import VideoCall from '$lib/components/VideoCall.svelte';
	import VideoPreview from '$lib/components/VideoPreview.svelte';
	import type { FeedbackDocument } from '$lib/ORM/models/feedback';
	import type { LinkDocument } from '$lib/ORM/models/link';
	import { userStream, type UserStreamType } from '$lib/userStream';
	import type { VideoCallType } from '$lib/videoCall';
	import { onMount } from 'svelte';
	import fsm from 'svelte-fsm';
	import urlJoin from 'url-join';
	import { publicDB, thisLink } from '$lib/ORM/dbs/publicDB';
	import { StorageTypes } from '$lib/ORM/rxdb';

	export let token: string;
	let link: LinkDocument;
	let linkId = $page.params.id;
	let vc: VideoCallType;
	let videoCall: any;
	let mediaStream: MediaStream;
	let us: Awaited<UserStreamType>;
	$: callState = 'disconnected';
	$: previousState = 'none';

	let feedback: FeedbackDocument | null = null;

	const linkState = fsm('neverConnected', {
		neverConnected: {
			call: 'calling'
		},
		rejected: {
			_enter() {
				feedback!.update({ $inc: { rejected: 1 } });
			},
			call: 'calling'
		},
		notAnswered: {
			_enter() {
				feedback!.update({ $inc: { unanswered: 1 } });
			},
			call: 'calling'
		},
		calling: {
			callAccepted: 'inCall',
			callRejected: 'rejected',
			receiverHangup: 'rejected',
			noAnswer: 'notAnswered'
		},
		inCall: {
			callEnded: 'callEnded',
			callDisconnected: 'disconnected',
			receiverHangup: 'disconnected'
		},
		disconnected: {
			_enter() {
				feedback!.update({ $inc: { disconnected: 1 } });
			},
			call: 'calling'
		},
		callEnded: {
			waitingForFeedback: 'waitForFeedback'
		},
		waitForFeedback: {
			feedbackGiven: 'complete'
		},
		complete: {}
	});

	if (browser) {
		// get link
		publicDB(token, linkId, StorageTypes.IDB).then(() => {
			thisLink.subscribe((_link) => {
				if (_link) {
					link = _link;
					if (link.feedback) {
						link.populate('feedback').then((_feedback: FeedbackDocument) => {
							if (_feedback) {
								_feedback.update({ $inc: { viewed: 1 } });
								_feedback.$.subscribe((_feedback: FeedbackDocument) => {
									feedback = _feedback;
								});
							}
						});
					} else {
						link.createFeedback().then((_feedback) => {
							_feedback.update({ $inc: { viewed: 1 } });
							_feedback.$.subscribe((_feedback: FeedbackDocument) => {
								feedback = _feedback;
							});
						});
					}
				}
			});
		});
		import('$lib/videoCall').then((_vc) => {
			videoCall = _vc.videoCall;
			vc = videoCall();
			vc.callState.subscribe((state) => {
				callState = state;
				switch (state) {
					case 'makingCall': {
						linkState.call();
						break;
					}
					case 'connectedAsCaller': {
						linkState.callAccepted();
						break;
					}
				}
			});
			vc.previousState.subscribe((_previousState) => {
				if (_previousState) {
					previousState = _previousState;
					switch (_previousState) {
						case 'callerEnded':
						case 'callerHangup': {
							linkState.callEnded();
							break;
						}
						case 'timeout': {
							linkState.noAnswer();
							break;
						}
						case 'receiverRejected': {
							linkState.callRejected();
							break;
						}
						case 'receiverHangup':
						case 'receiverEnded': {
							linkState.receiverHangup();
							break;
						}
					}
				}
			});
		});
	}

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
	$: showFeedback = false;
</script>

<LinkFeedback {showFeedback} />
<div class="min-h-full">
	<main class="py-6">
		{#if link}
			{#if $linkState != 'inCall'}
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
							<LinkDetail {link} />
						</div>
						<div class="pb-6 btn-group justify-center">
							<button class="btn btn-secondary" on:click={call} disabled={callState != 'ready'}
								>Call {link.talentName} Now</button
							>
						</div>
					</div>

					<div class="bg-base-200  text-white card lg:min-w-200">
						<div class="text-center card-body items-center ">
							<div class="text-2xl card-title">Your Video Preview</div>
							<div class="container h-full rounded-2xl max-w-2xl">
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
<div class="flex w-full place-content-center">
	<div class="bg-primary shadow text-primary-content  stats stats-vertical lg:stats-horizontal">
		{#if feedback}
			<div class="stat">
				<div class="stat-title">Views</div>
				<div class="stat-value">{feedback.viewed}</div>
			</div>
			<div class="stat">
				<div class="stat-title">Rejected</div>
				<div class="stat-value">{feedback.rejected}</div>
			</div>
			<div class="stat">
				<div class="stat-title">Disconnected</div>
				<div class="stat-value">{feedback.disconnected}</div>
			</div>
			<div class="stat">
				<div class="stat-title">UnAnswered</div>
				<div class="stat-value">{feedback.unanswered}</div>
			</div>
		{/if}
		<div class="stat">
			<div class="stat-title">Link State</div>
			<div class="stat-value">{$linkState}</div>
		</div>
		<div class="stat">
			<div class="stat-title">Call State</div>
			<div class="stat-value">{previousState}</div>
		</div>
	</div>
</div>
