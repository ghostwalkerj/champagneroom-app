<script lang="ts">
  import 'iconify-icon';

  import Config from '$lib/config';
</script>

<footer class="w-full flex-shrink-0 mt-20 px-4 md:px-6 lg:px-10">
  <div class="w-full flex flex-col lg:flex-row pb-6 justify-center">
    <div
      class="flex flex-col md:flex-row mx-auto md:space-x-4 whitespace-nowrap w-full text-center md:justify-evenly"
    >
      <div class="mb-6 md:mb-0">
        <h5 class="text-info mb-3">Social</h5>
        <ul class="list-none">
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
      <div class="mb-6 md:mb-0">
        <h5 class="text-info mb-3">Services</h5>
        <ul class="list-none">
          <li class="spa">
            <a href={Config.Path.creator}>Creators</a>
          </li>
          <li class="spa">
            <a href={Config.Path.agent}>Management</a>
          </li>
        </ul>
      </div>
      <div class="">
        <h5 class="text-info mb-3">Learn</h5>
        <ul class="list-none">
          <li class="spa">
            <a
              href="{Config.Path
                .staticUrl}/assets/champagne-room-white-paper.pdf"
              >White Paper</a
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</footer>
