<script lang="ts">
	import type { ToggleMachineType } from '$lib/machines/mediaToggleMachine';
	import type { UserStreamType } from '$lib/util/userStream';
	import { onMount } from 'svelte';
	import { MicIcon, MicOffIcon, VideoIcon, VideoOffIcon } from 'svelte-feather-icons';
	import { useMachine } from '@xstate/svelte';
	import { matchesState } from 'xstate';

	// UI Controls
	let localVideo: HTMLVideoElement;
	export let us: Awaited<UserStreamType>;
	let initialized = false;
	let camMachine: ReturnType<typeof useMachine<ToggleMachineType>>;
	let micMachine: ReturnType<typeof useMachine<ToggleMachineType>>;
	let camState: typeof camMachine.state;
	let micState: typeof micMachine.state;
	let mediaStream: MediaStream;

	$: if (us) {
		camMachine = useMachine(us.camMachine);
		camState = camMachine.state;
		micMachine = useMachine(us.micMachine);
		micState = micMachine.state;
		us.mediaStream.subscribe((stream) => {
			if (stream) mediaStream = stream;
			initialize();
		});
	}

	onMount(async () => {
		initialize();
	});

	const initialize = () => {
		if (localVideo && mediaStream) {
			localVideo.srcObject = mediaStream;
			localVideo.muted = true;
			localVideo.load();
			localVideo.play();
			initialized = true;
		}
	};
</script>

<div class="container h-full">
	<div class="rounded-xl  w-full p-2">
		<video bind:this={localVideo} playsinline autoplay>
			<track kind="captions" />
		</video>
	</div>
	{#if initialized}
		<section
			class="flex bg-base-100 flex-shrink-0 text-white p-4 gap-4 items-center justify-center md:rounded-2xl md:gap-8 "
		>
			<div class="flex flex-col gap-2 items-center">
				<button class="h-14 w-14 btn btn-circle " on:click={() => camMachine.send('TOGGLE')}>
					{#if $camState.matches('on')}
						<VideoIcon size="34" />
					{:else}
						<VideoOffIcon size="34" />
					{/if}
				</button>
				Cam
			</div>
			<div class="flex flex-col gap-2 items-center">
				<button class="h-14 w-14 btn btn-circle" on:click={() => micMachine.send('TOGGLE')}>
					{#if $micState.matches('on')}
						<MicIcon size="34" />
					{:else}
						<MicOffIcon size="34" />
					{/if}
				</button>
				Mic
			</div>
		</section>
	{/if}
</div>
