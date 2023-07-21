<script lang="ts">
  import 'iconify-icon';

  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div>
  <div class="container mx-auto">
    <footer class="w-full py-4 flex-shrink-0" data-aos="fade-In">
      <div class="w-full flex flex-col lg:flex-row py-4">
        <div
          class="flex flex-col 2sx:flex-row mx-auto 2sx:space-x-4 whitespace-nowrap w-full text-center 2sx:place-content-evenly"
        >
          <div class="">
            <h5 class="text-info sm:mb-3">Social</h5>
            <ul class="list-unstyled text-[#d0dce8]">
              <li class="spa" />
              <li class="spa">
                <a href="" target="_blank">
                  <iconify-icon icon="line-md:discord-twotone" />

                  <span class="icon-list-text">Discord</span>
                </a>
              </li>
              <li class="spa">
                <a href="" target="_blank">
                  <iconify-icon icon="line-md:reddit-loop" />
                  <span class="icon-list-text">Reddit</span>
                </a>
              </li>
              <li class="spa">
                <a href="https://github.com/" target="_blank">
                  <iconify-icon icon="line-md:github-loop" />

                  <span class="icon-list-text">Github</span>
                </a>
              </li>
            </ul>
          </div>
          <div class="">
            <h5 class="text-info sm:mb-3">Products</h5>
            <ul class="list-unstyled text-[#d0dce8]">
              <li class="spa">
                <a href="#">For Agents</a>
              </li>
              <li class="spa">
                <a href="#">For Creators</a>
              </li>
            </ul>
          </div>
          <div class="">
            <h5 class="text-info sm:mb-3">Learn</h5>
            <ul class="list-unstyled text-[#d0dce8]">
              <li class="spa">
                <a href="#">Documentation</a>
              </li>
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
            class="font-['SpaceGrotesk'] btn mt-2 ml-6 btn-outline btn-primary whitespace-nowrap"
            href="/agent"
          >
            Open App
          </a>
        </div>
      </div>
    </footer>
  </div>
</div>
