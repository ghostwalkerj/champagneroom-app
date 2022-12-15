<script lang="ts">
  import { onMount, afterUpdate, onDestroy } from 'svelte';
  import { uuidv4 } from 'lib/jitsi-svelte/utils/uuid';
  import { createElementAndTrackStore } from 'lib/jitsi-svelte/stores/ElementTrackStore';

  export let id = uuidv4();
  export let autoPlay = true;
  export let fullscreen = false;
  // iOS needs this so the video doesn't automatically play full screen
  export let playsInline = true;
  export let track = null;
  export let mirror = false;
  const placeholder = import.meta.env.VITE_BLACK_IMAGE;

  let videoElement: HTMLVideoElement;

  const store = createElementAndTrackStore();

  onMount(() => {
    store.setElement(videoElement);
  });

  afterUpdate(() => {
    store.setTrack(track);
    videoElement.play();
  });

  onDestroy(store.destroy);
</script>

<!-- Note:
  A number of video attributes are HTML "Boolean attributes", so to prevent the 
  attribute key from being incorrectly rendered, Svelte needs the value to be
  `undefined` when false:
  - autoplay
  - playsinline
  - disablepictureinpicture
-->
<!-- svelte-ignore a11y-media-has-caption -->
<video
  bind:this={videoElement}
  class:mirror
  class:fullscreen
  {id}
  playsInline={playsInline ? true : undefined}
  disablePictureInPicture
  autoplay={autoPlay ? true : undefined}
  poster={placeholder}
/>

<style>
  video {
    object-fit: cover;
    width: 100%;
    height: 100%;
  }
  .mirror {
    transform: scaleX(-1);
  }
  .fullscreen {
    width: 100%;
    height: 100%;
  }
</style>
