<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div class="w-screen text-center font-bold text-xl lg:text-2xl xl:text-3xl">
  FAQ
</div>

<div
  class="absolute mt-2 mt-2 mx-auto opacity-20 rounded-lg opacity-10 justify-center justify-center w-screen h-screen"
  style="background-image: url('{PUBLIC_STATIC_URL}/assets/crbubbles.png')"
/>
<div class="py-10">
  <!-- Page header -->

  <div
    class="mx-auto px-4 sm:px-6 md:flex md:space-x-5 md:items-center md:justify-between lg:px-8"
  >
    <div class="flex space-x-5 items-center w-full">
      <div class="fixed top-10 grid grid-cols-2">
        <div
          class="image opacity-20 max-width-l hidden md:flex animate-pulse transition-timing-function mt-20 mb-10"
        >
          <div class="h-xl w-xl">
            <img
              class="motion-safe:animate-fadeIn mx-auto rounded-lg opacity-45 justify-center -space-x-20 justify-center w-m h-m"
              src="{PUBLIC_STATIC_URL}/assets/ladyblue.png"
              alt="Lady Blue"
            />
          </div>
        </div>

        <div
          class="image opacity-20 hidden md:flex animate-pulse transition-timing-function mt-20 mb-10"
        >
          <div class="h-xl w-xl">
            <img
              class="motion-safe:animate-fadeIn mx-auto rounded-lg opacity-45 justify-center -space-x-20 justify-center w-m h-m"
              src="{PUBLIC_STATIC_URL}/assets/ladypink.png"
              alt="Lady Pink"
            />
          </div>
        </div>
      </div>
      <div class="w-screen flex place-content-center">
        <div class="max-w-2xl flex flex-col gap-4">
          <div class="collapse collapse-arrow bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div class="collapse-title text-xl font-medium">
              What is Champagne Room?
            </div>
            <div class="collapse-content">
              <div class="flex flex-col gap-2">
                <div>
                  The Champagne Room is a rapidly growing ecosystem in the NSFW
                  niche. It functions as a decentralized layer 2 DApp,
                  connecting Creators with Fans. Initially, it offers
                  Fan-Creator video calls as a means of interaction. In the
                  future, the project aims to build an NFT marketplace where
                  creators can connect with fans and receive support through
                  exclusive drops.
                </div>

                <div>
                  Overall, the Champagne Room aims to create an ecosystem that
                  bridges the gap between NSFW creators and their fans, offering
                  a decentralized platform for interaction and support.
                </div>
              </div>
            </div>
          </div>
          <div class="collapse collapse-arrow bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div class="collapse-title text-xl font-medium">
              How does it work?
            </div>
            <div class="collapse-content">
              <p>hello</p>
            </div>
          </div>
          <div class="collapse collapse-arrow bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div class="collapse-title text-xl font-medium">
              How are my transactions protected?
            </div>
            <div class="collapse-content">
              <p>hello</p>
            </div>
          </div>
          <div class="collapse collapse-arrow bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div class="collapse-title text-xl font-medium">
              Is it anonymous?
            </div>
            <div class="collapse-content">
              <p>hello</p>
            </div>
          </div>
          <div class="collapse collapse-arrow bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div class="collapse-title text-xl font-medium">
              How is Champagne Room different from other platforms like Only
              Fans?
            </div>
            <div class="collapse-content">
              <p>hello</p>
            </div>
          </div>
          <div class="collapse collapse-arrow bg-base-200">
            <input type="radio" name="faq-accordion" />
            <div class="collapse-title text-xl font-medium">
              What is the road map and future of Champagne Room?
            </div>
            <div class="collapse-content">
              <p>hello</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
