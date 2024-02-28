<script lang="ts">
  import Saos from 'saos';

  import config from '$lib/config';

  import About from './About.svelte';
  import Contact from './Contact.svelte';
  import Creators from './Creators.svelte';
  import FAQ from './FAQ.svelte';
  import TheShow from './TheShow.svelte';
  import Token from './Token.svelte';

  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<div class="mt-20 flex items-center justify-center" id="topPage">
  <div class="flex flex-col items-center space-y-4 lg:flex-row">
    <div class="w-full pl-5">
      <h2
        class="mb-6 px-6 text-center font-CaviarDreams text-[41px] font-bold leading-none text-info lg:text-left"
      >
        A New Way to Discretely View NSFW Creators Live
      </h2>
      <ul
        class="list-inside list-disc text-[25px] text-lg font-medium lg:pl-10"
      >
        <li class="mt-2">Watch Completely Anonymous</li>
        <li class="mt-2">No Downloads, No Signup, No Personal Information</li>
        <li class="mt-2">Protected by a Full Escrow Service</li>
        <li class="mt-2">Get paid instantly as a Creator</li>
      </ul>
      <div
        class="mt-10 flex flex-col place-content-center space-x-0 space-y-6 2sx:flex-row 2sx:space-x-6 2sx:space-y-0 lg:place-content-start"
      >
        <div>
          <a
            href="#FAQ"
            class="variant-filled-primary btn transition-all duration-300 ease-in-out md:w-auto"
          >
            Read the FAQ
          </a>
        </div>
        <div>
          <a
            href="{config.PATH.staticUrl}/assets/champagne-room-white-paper.pdf"
            class="variant-filled-secondary btn transition-all duration-300 ease-in-out md:w-auto"
            target="_blank"
          >
            White Paper
          </a>
        </div>
      </div>
    </div>
    <div class="w-full max-w-3xl p-10 lg:max-w-max">
      <video
        autoplay
        loop
        controls
        muted
        class="rounded-xl opacity-80 shadow-[0px_0px_17px_6px_#e779c1]"
        width="800px"
        height="450px"
      >
        <source
          src="{config.PATH.staticUrl}/assets/champagnevideo.mp4"
          type="video/mp4"
        />
      </video>
    </div>
  </div>
</div>

<Saos
  animation="fade-in 1.8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both"
  animation_out="slide-out-fwd-center 0.7s cubic-bezier(0.550, 0.085, 0.680, 0.530) both"
  top={250}
  bottom={250}
>
  <About />
</Saos>

<Saos
  animation="fade-in 1.8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both"
  animation_out="slide-out-fwd-center 0.7s cubic-bezier(0.550, 0.085, 0.680, 0.530) both"
  top={250}
  bottom={250}
>
  <TheShow />
</Saos>

<Saos
  animation="fade-in 1.8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both"
  animation_out="slide-out-fwd-center 0.7s cubic-bezier(0.550, 0.085, 0.680, 0.530) both"
  top={250}
  bottom={250}
>
  <FAQ />
</Saos>

<Saos
  animation="fade-in 1.8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both"
  animation_out="slide-out-fwd-center 0.7s cubic  -bezier(0.550, 0.085, 0.680, 0.530) both"
  top={250}
  bottom={250}
>
  <div class="pt-28">
    <Creators />
  </div>
</Saos>

<Saos
  animation="fade-in 1.8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both"
  animation_out="slide-out-fwd-center 0.7s cubic-bezier(0.550, 0.085, 0.680, 0.530) both"
  top={250}
  bottom={250}
>
  <Token />
</Saos>

<Saos
  animation="fade-in 1.8s cubic-bezier(0.390, 0.575, 0.565, 1.000) both"
  animation_out="slide-out-fwd-center 0.7s cubic-bezier(0.550, 0.085, 0.680, 0.530) both"
  top={250}
  bottom={250}
>
  <Contact {form} />
</Saos>

<style>
  @keyframes -global-from-left {
    0% {
      transform: rotateX(50deg) translateX(-200vw) skewX(-50deg);
      opacity: 1;
    }
    100% {
      transform: rotateX(0deg) translateX(0) skewX(0deg);
      opacity: 1;
    }
  }

  @keyframes -global-from-right {
    0% {
      transform: rotateX(50deg) translateX(200vw) skewX(50deg);
      opacity: 1;
    }
    100% {
      transform: rotateX(0deg) translateX(0) skewX(0);
      opacity: 1;
    }
  }

  /* ----------------------------------------------
 * Animations below by Animista on 2020-7-11
 * Licensed under FreeBSD License.
 * See http://animista.net/license for more info.
 * w: http://animista.net, t: @cssanimista
 * ---------------------------------------------- */

  @keyframes -global-scale-in-center {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes -global-rotate-in-center {
    0% {
      transform: rotate(-360deg);
      opacity: 0;
    }
    100% {
      transform: rotate(0);
      opacity: 1;
    }
  }

  @keyframes -global-slide-in-top {
    0% {
      transform: translateY(-1000px);
      opacity: 0;
    }
    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }

  @keyframes -global-slide-in-fwd-tr {
    0% {
      transform: translateZ(-1200px) translateY(-700px) translateX(500px);
      opacity: 0;
    }
    100% {
      transform: translateZ(0) translateY(0) translateX(0);
      opacity: 1;
    }
  }

  @keyframes -global-slide-in-elliptic-top-fwd {
    0% {
      transform: translateY(-600px) rotateX(-30deg) scale(0);
      transform-origin: 50% 100%;
      opacity: 0;
    }
    100% {
      transform: translateY(0) rotateX(0) scale(1);
      transform-origin: 50% 1400px;
      opacity: 1;
    }
  }

  @keyframes -global-roll-in-left {
    0% {
      transform: translateX(-800px) rotate(-540deg);
      opacity: 0;
    }
    100% {
      transform: translateX(0) rotate(0deg);
      opacity: 1;
    }
  }

  @keyframes -global-roll-in-blurred-left {
    0% {
      transform: translateX(-1000px) rotate(-720deg);
      filter: blur(50px);
      opacity: 0;
    }
    100% {
      transform: translateX(0) rotate(0deg);
      filter: blur(0);
      opacity: 1;
    }
  }

  @keyframes -global-tilt-in-fwd-tr {
    0% {
      transform: rotateY(20deg) rotateX(35deg) translate(300px, -300px)
        skew(-35deg, 10deg);
      opacity: 0;
    }
    100% {
      transform: rotateY(0) rotateX(0deg) translate(0, 0) skew(0deg, 0deg);
      opacity: 1;
    }
  }

  @keyframes -global-swing-in-top-fwd {
    0% {
      transform: rotateX(-100deg);
      transform-origin: top;
      opacity: 0;
    }
    100% {
      transform: rotateX(0deg);
      transform-origin: top;
      opacity: 1;
    }
  }

  @keyframes -global-puff-in-center {
    0% {
      transform: scale(2);
      filter: blur(4px);
      opacity: 0;
    }
    100% {
      transform: scale(1);
      filter: blur(0px);
      opacity: 1;
    }
  }

  @keyframes -global-fade-in {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }

  /* EXITS */
  @keyframes -global-scale-out-center {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    100% {
      transform: scale(0);
      opacity: 1;
    }
  }

  @keyframes -global-rotate-out-center {
    0% {
      transform: rotate(0);
      opacity: 1;
    }
    100% {
      transform: rotate(-360deg);
      opacity: 0;
    }
  }

  @keyframes -global-rotate-out-2-cw {
    0% {
      transform: rotate(0);
      opacity: 1;
    }
    100% {
      transform: rotate(45deg);
      opacity: 0;
    }
  }

  @keyframes -global-swirl-out-bck {
    0% {
      transform: rotate(0) scale(1);
      opacity: 1;
    }
    100% {
      transform: rotate(-540deg) scale(0);
      opacity: 0;
    }
  }

  @keyframes -global-flip-out-hor-top {
    0% {
      transform: rotateX(0);
      opacity: 1;
    }
    100% {
      transform: rotateX(70deg);
      opacity: 0;
    }
  }

  @keyframes -global-slide-out-top {
    0% {
      transform: translateY(0);
      opacity: 1;
    }
    100% {
      transform: translateY(-1000px);
      opacity: 0;
    }
  }

  @keyframes -global-slide-out-fwd-center {
    0% {
      transform: translateZ(1);
      opacity: 1;
    }
    100% {
      transform: translateZ(600px);
      opacity: 0;
    }
  }

  @keyframes -global-slide-out-elliptic-top-bck {
    0% {
      transform: translateY(0) rotateX(0) scale(1);
      transform-origin: 50% 1400px;
      opacity: 1;
    }
    100% {
      transform: translateY(-600px) rotateX(-30deg) scale(0);
      transform-origin: 50% 100%;
      opacity: 1;
    }
  }
</style>
