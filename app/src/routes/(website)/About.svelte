<script lang="ts">
  import { Image } from '@unpic/svelte';

  import config from '$lib/config';
</script>

<div id="About">
  <div class="mx-auto pt-20">
    <h2
      class="text-center font-CaviarDreams text-[32px] font-bold text-primary lg:mb-10 lg:text-[41px]"
    >
      ABOUT
    </h2>
    <div class="flex flex-col items-center justify-center px-6 lg:flex-row">
      <div class="m-3 flex w-full justify-center p-6">
        <Image
          src="{config.PATH.staticUrl}/assets/creator4.png"
          alt="Creator"
          class="max-w-xs overflow-hidden rounded-xl shadow-[0px_0px_17px_6px_#e779c1] md:max-w-sm lg:max-w-md"
          height={680}
          width={480}
        />
      </div>
      <div class="m-auto w-full font-medium">
        <p class="mx-5 mt-5 leading-10 md:mx-10 lg:mr-20 lg:text-lg">
          Welcome to Champagne Room, the cutting-edge web 3.0 platform
          revolutionizing NSFW experiences. Our platform enables fans to engage
          in secure, one-on-one calls with their favorite creators, scheduled
          conveniently to their preference.
        </p>
        <p class="mx-5 mt-5 leading-10 md:mx-10 lg:mr-20 lg:text-lg">
          By settling transactions in cryptocurrency, Champagne Room ensures a
          level of privacy and security that both parties can rely on.
        </p>
        <p class="mx-5 mt-5 leading-10 md:mx-10 lg:mr-20 lg:text-lg">
          Experience a whole new level of NSFW entertainment on Champagne Room.
          Our platform offers a range of features including creator NFTs,
          exclusive content sharing, and immersive calls for the most devoted
          fans.
        </p>
        <p class="mx-5 mt-5 leading-10 md:mx-10 lg:mr-20 lg:text-lg">
          Through crypto subscriptions, dedicated followers gain access to
          unique and intimate experiences, further enhancing their connection
          with their preferred creators.
        </p>
        <p class="mx-5 mt-5 leading-10 md:mx-10 lg:mr-20 lg:text-lg">
          Discover the future of NSFW interaction with Champagne Room.
        </p>
        <p class=" mx-5 mt-5 leading-10 md:mx-10 lg:mr-20 lg:text-lg">
          Our platform combines cutting-edge technology, secure crypto
          transactions, and a seamless user experience to redefine the way fans
          connect with their favorite creators.
        </p>
        <p class="mx-5 mt-5 leading-10 md:mx-10 lg:mr-20 lg:text-lg">
          Join us on this exciting journey as we reshape the landscape of adult
          entertainment, providing a safe and private space for genuine
          connections to thrive.
        </p>
      </div>
    </div>

    <div class="mt-5 lg:mt-10">
      <div class="p-6">
        <div
          class="text-center font-CaviarDreams text-xl font-bold text-primary md:text-2xl lg:mx-10 lg:text-[32px]"
        >
          We have specifically built CHAMPAGNE ROOM with a focus on anonymity,
          safety, and privacy for both our users and creators.
        </div>
      </div>
    </div>
  </div>
</div>
