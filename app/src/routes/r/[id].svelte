<script type="ts">
	import { browser } from '$app/env';
	import { page } from '$app/stores';
	import VideoCall from 'components/VideoCall.svelte';
	import VideoPreview from 'components/VideoPreview.svelte';
	import LinkDetail from 'components/LinkDetail.svelte';
	import LinkFeedback from 'components/Feedback.svelte';
	import { gun } from 'db';
	import { LinkById, type Link } from 'db/models/link';
	import { userStream, type UserStreamType } from 'lib/userStream';
	import type { VideoCallType } from 'lib/videoCall';
	import { onMount } from 'svelte';
	import fsm from 'svelte-fsm';

	import { createFeedback, FeedbackByLinkId, type Feedback } from 'db/models/feedback';
	let link: Link;
	let linkId = $page.params.id;
	let linkById = gun.get(LinkById);
	let vc: VideoCallType;
	let videoCall;
	let mediaStream: MediaStream;
	let us: Awaited<UserStreamType>;
	$: callState = 'disconnected';
	$: previousState = 'none';

	let feedback: Feedback | null = null;
	let linkRef = linkById.get(linkId);
	const feedbackByLinkId = gun.get(FeedbackByLinkId);

	// get link
	linkRef.on((_link) => {
		console.log('listen link: ' + _link.profileImageUrl);
		if (_link && !link) {
			link = _link;
		}
	});

	// linkRef.get('profileImageUrl').on((profileImageUrl) => {
	// 	if (profileImageUrl && link) {
	// 		link.profileImageUrl = profileImageUrl;
	// 		console.log('new profileImageUrl: ' + profileImageUrl);
	// 	}
	// });

	if (feedback == null) {
		feedbackByLinkId
			.get(linkId, (ack) => {
				if (!ack.put) {
					feedback = createFeedback({
						linkId,
						rejectedCount: 0,
						disconnectCount: 0,
						notAnsweredCount: 0,
						rating: 0
					});
					console.log('Created New Feedback');
					feedbackByLinkId.get(linkId).put(feedback);
				}
			})
			.on((_feedback) => {
				if (_feedback && !feedback) {
					feedback = _feedback;
					console.log('Got Feedback');
				}
			});
	}

	const linkState = fsm('neverConnected', {
		neverConnected: {
			call: 'calling'
		},
		rejected: {
			_enter() {
				feedback.rejectedCount++;
			},
			call: 'calling'
		},
		notAnswered: {
			_enter() {
				feedback.notAnsweredCount++;
			},
			call: 'calling'
		},
		calling: {
			callAccepted: 'inCall',
			callRejected: 'rejected',
			recieverHangup: 'rejected',
			noAnswer: 'notAnswered'
		},
		inCall: {
			callEnded: 'callEnded',
			callDisconnected: 'disconnected',
			recieverHangup: 'disconnected'
		},
		disconnected: {
			_enter() {
				feedback.disconnectCount++;
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
		import('lib/videoCall').then((_vc) => {
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
							linkState.recieverHangup();
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
					class="max-w-max	 container mx-auto  items-center sm:px-6 md:flex md:space-x-5 md:items-stretch  lg:px-8"
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

					<div class="bg-base-200  text-white card lg:min-w-200">
						<div class="text-center card-body items-center ">
							<div class="text-2xl card-title">Your Video Preview</div>
							<div class="container rounded-2xl max-w-2xl h-full">
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
Link: {$linkState}
<br />
Call: {previousState}
<br />

{#if feedback}
	RejectedCount: {feedback.rejectedCount}
	<br />

	DisconnectCount: {feedback.disconnectCount}
	<br />

	NotAnsweredCount: {feedback.notAnsweredCount}
{/if}
