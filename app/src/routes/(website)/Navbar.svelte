<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div class="flex flex-col lg:flex-row w-screen">
  <div class="m-auto w-screen max-w-[600px] mb-6 lg:max-w-[280px]">
    <img
      alt="logo"
      src="{PUBLIC_STATIC_URL}/assets/logo-horizontal-tr.png"
      class="lg:ml-10 mr-2 w-auto my-auto mt-1"
    />
  </div>
  <div class="hidden lg:w-full lg:flex ml-10">
    <div class="navbar-center py-2 lg:flex w-full justify-end">
      <ul class="menu menu-horizontal px-4 mt-2 mr-10 min-w-full justify-end">
        <li>
          <a
            class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
            href="#About"
          >
            About
          </a>
        </li>
        <li>
          <a
            class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
            href="#GetStarted"
          >
            Get Started
          </a>
        </li>
        <li>
          <a class="btn btn-sm btn-outline btn-secondary mt-2 ml-3" href="#FAQ">
            FAQ
          </a>
        </li>
        <li>
          <a
            class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
            href="#token"
          >
            TOKEN
          </a>
        </li>

        <li>
          <a
            class="btn btn-sm btn-outline btn-secondary mt-2 ml-3"
            href="#Interest"
          >
            Show Interest
          </a>
        </li>

        <a
          class=" flex items-center btn ml-6 btn-outline btn-primary whitespace-nowrap shadow-[0px_0px_17px_6px_#e779c1]"
          href="/app"
        >
          Open App
        </a>
      </ul>
    </div>
    <div class="navbar-end hidden sm:block" />
  </div>
  <div class="lg:hidden flex w-full mt-4 place-content-center">
    <a
      class="btn btn-outline btn-primary whitespace-nowrap shadow-[0px_0px_17px_6px_#e779c1]"
      href="/app"
    >
      Open App
    </a>
  </div>
</div>
