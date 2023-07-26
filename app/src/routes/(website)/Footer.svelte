<script lang="ts">
  import 'iconify-icon';

  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div>
  <div class="container mx-auto font-Roboto">
    <footer class="w-full py-4 flex-shrink-0" data-aos="fade-In">
      <div class="w-full flex flex-col lg:flex-row py-4">
        <div
          class="flex flex-col 2sx:flex-row mx-auto 2sx:space-x-4 whitespace-nowrap w-full text-center 2sx:place-content-evenly"
        >
          <div class="">
            <h5 class="text-info sm:mb-3">Social</h5>
            <ul class="list-unstyled text-[#d0dce8]">
              <li class="spa">
                <a href="https://discord.gg/VgB7bWScVa" target="_blank">
                  <iconify-icon icon="line-md:discord-twotone" />

                  <span class="icon-list-text">Discord</span>
                </a>
              </li>
              <li class="spa">
                <a href="https://twitter.com/_Champagne_Room" target="_blank">
                  <iconify-icon icon="line-md:twitter-twotone" />
                  <span class="icon-list-text">Twitter</span>
                </a>
              </li>
            </ul>
          </div>
          <div class="">
            <h5 class="text-info sm:mb-3">Services</h5>
            <ul class="list-unstyled text-[#d0dce8]">
              <li class="spa">
                <a href="#">Creators</a>
              </li>
              <li class="spa">
                <a href="#">Management</a>
              </li>
            </ul>
          </div>
          <div class="">
            <h5 class="text-info sm:mb-3">Learn</h5>
            <ul class="list-unstyled text-[#d0dce8] font-Roboto">
              <li class="spa">
                <a
                  href="{PUBLIC_STATIC_URL}/assets/champagne-room-white-paper.pdf"
                  >White Paper</a
                >
              </li>
            </ul>
          </div>
        </div>
        <div class="p-4 mr-10 flex justify-center">
          <a
            class="font-SpaceGrotesk btn mt-2 ml-6 btn-outline btn-primary whitespace-nowrap shadow-[0px_0px_17px_6px_#e779c1]"
            href="/app"
          >
            Open App
          </a>
        </div>
      </div>
    </footer>
  </div>
</div>
