<script lang="ts">
	import { onMount } from 'svelte';
	import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon } from 'svelte-feather-icons';
	import { userStream, type UserStreamType } from 'lib/userStream';

	// UI Controls
	let localVideo: HTMLVideoElement;
	let us: Awaited<UserStreamType> = null;
	let initialized = false;
	let camState: typeof us.camState;
	let micState: typeof us.micState;

	onMount(async () => {
		initialize();
	});

	const initialize = async () => {
		us = await userStream();
		localVideo.srcObject = us.mediaStream;
		localVideo.play();
		camState = us.camState;
		micState = us.micState;
		initialized = true;
	};
</script>

<div class="rounded-xl border-2 h-full p-2 w-full">
	<video bind:this={localVideo} playsinline autoplay>
		<track kind="captions" />
	</video>
</div>
{#if initialized}
	<section
		class="flex bg-base-100 flex-shrink-0 p-4 gap-4 items-center justify-center text-white md:rounded-2xl md:gap-8 "
	>
		<div class="flex flex-col gap-2 items-center">
			<button class="h-14 w-14 btn btn-circle " on:click={camState.toggleCam}>
				{#if $camState === 'CamOn'}
					<VideoIcon size="34" />
				{:else}
					<VideoOffIcon size="34" />
				{/if}
			</button>
			Cam
		</div>
		<div class="flex flex-col gap-2 items-center">
			<button class="h-14 w-14 btn btn-circle" on:click={micState.toggleMic}>
				{#if $micState === 'MicOn'}
					<MicIcon size="34" />
				{:else}
					<MicOffIcon size="34" />
				{/if}
			</button>
			Mic
		</div>
	</section>
{/if}
