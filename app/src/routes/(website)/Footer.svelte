<script lang="ts">
  import 'iconify-icon';

  import {
    PUBLIC_AGENT_PATH,
    PUBLIC_CREATOR_PATH,
    PUBLIC_STATIC_URL
  } from '$env/static/public';
</script>

<footer class="w-full flex-shrink-0 mt-20">
  <div class="w-full flex flex-col lg:flex-row pb-6">
    <div
      class="flex flex-col 2sx:flex-row mx-auto 2sx:space-x-4 whitespace-nowrap w-full text-center 2sx:place-content-evenly"
    >
      <div class="">
        <h5 class="text-info sm:mb-3">Social</h5>
        <ul class="list-unstyled">
          <li class="spa">
            <a href="https://discord.gg/VgB7bWScVa" target="_blank">
              <iconify-icon icon="line-md:discord-twotone" />

              <span class="icon-list-text">Discord</span>
            </a>
          </li>
          <li class="spa">
            <a href="https://twitter.com/_Champagne_Room" target="_blank">
              <iconify-icon icon="simple-icons:x" />
              <span class="icon-list-text">(Twitter)</span>
            </a>
          </li>
        </ul>
      </div>
      <div class="">
        <h5 class="text-info sm:mb-3">Services</h5>
        <ul class="list-unstyled">
          <li class="spa">
            <a href={PUBLIC_CREATOR_PATH}>Creators</a>
          </li>
          <li class="spa">
            <a href={PUBLIC_AGENT_PATH}>Management</a>
          </li>
        </ul>
      </div>
      <div class="">
        <h5 class="text-info sm:mb-3">Learn</h5>
        <ul class="list-unstyled">
          <li class="spa">
            <a href="{PUBLIC_STATIC_URL}/assets/champagne-room-white-paper.pdf"
              >White Paper</a
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</footer>
