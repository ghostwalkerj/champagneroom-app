<script lang="ts">
  import config from '$lib/config';
  import { Image } from '@unpic/svelte';
</script>

<div id="About">
  <div class="pt-20 mx-auto">
    <h2
      class="text-primary font-bold text-[32px] lg:text-[41px] text-center font-CaviarDreams lg:mb-10"
    >
      ABOUT
    </h2>
    <div class="flex flex-col lg:flex-row items-center justify-center px-6">
      <div class="w-full m-3 p-6 flex justify-center">
        <Image
          src="{config.PATH.staticUrl}/assets/creator4.png"
          alt="Creator"
          class="rounded-xl overflow-hidden shadow-[0px_0px_17px_6px_#e779c1] max-w-xs md:max-w-sm lg:max-w-md"
          height={680}
          width={480}
        />
      </div>
      <div class="w-full m-auto font-medium">
        <p class="lg:text-lg leading-10 mt-5 mx-5 md:mx-10 lg:mr-20">
          Welcome to Champagne Room, the cutting-edge web 3.0 platform
          revolutionizing NSFW experiences. Our platform enables fans to engage
          in secure, one-on-one calls with their favorite creators, scheduled
          conveniently to their preference.
        </p>
        <p class="lg:text-lg leading-10 mt-5 mx-5 md:mx-10 lg:mr-20">
          By settling transactions in cryptocurrency, Champagne Room ensures a
          level of privacy and security that both parties can rely on.
        </p>
        <p class="lg:text-lg leading-10 mt-5 mx-5 md:mx-10 lg:mr-20">
          Experience a whole new level of NSFW entertainment on Champagne Room.
          Our platform offers a range of features including creator NFTs,
          exclusive content sharing, and immersive calls for the most devoted
          fans.
        </p>
        <p class="lg:text-lg leading-10 mt-5 mx-5 md:mx-10 lg:mr-20">
          Through crypto subscriptions, dedicated followers gain access to
          unique and intimate experiences, further enhancing their connection
          with their preferred creators.
        </p>
        <p class="lg:text-lg leading-10 mt-5 mx-5 md:mx-10 lg:mr-20">
          Discover the future of NSFW interaction with Champagne Room.
        </p>
        <p class=" lg:text-lg leading-10 mt-5 mx-5 md:mx-10 lg:mr-20">
          Our platform combines cutting-edge technology, secure crypto
          transactions, and a seamless user experience to redefine the way fans
          connect with their favorite creators.
        </p>
        <p class="lg:text-lg leading-10 mt-5 mx-5 md:mx-10 lg:mr-20">
          Join us on this exciting journey as we reshape the landscape of adult
          entertainment, providing a safe and private space for genuine
          connections to thrive.
        </p>
      </div>
    </div>

    <div class="mt-5 lg:mt-10">
      <div class="p-6">
        <div
          class="text-xl md:text-2xl lg:text-[32px] font-bold lg:mx-10 text-primary font-CaviarDreams text-center"
        >
          We have specifically built CHAMPAGNE ROOM with a focus on anonymity,
          safety, and privacy for both our users and creators.
        </div>
      </div>
    </div>
  </div>
</div>
