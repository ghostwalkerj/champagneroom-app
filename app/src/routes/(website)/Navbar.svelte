<script lang="ts">
  import { PUBLIC_STATIC_URL } from '$env/static/public';
</script>

<div class="flex w-screen">
  <div class="w-1/2">
    <div class="m-auto w-screen lg:max-w-[400px]">
      <img
        alt="logo"
        src="{PUBLIC_STATIC_URL}/assets/logo-horizontal-tr.png"
        class="lg:ml-10 mr-2 w-auto my-auto mt-1"
      />
    </div>
  </div>
  <div class="hidden lg:w-full lg:flex ml-10">
    <div class="navbar-center py-2 lg:flex w-full justify-end">
      <ul class="menu menu-horizontal px-4 mt-2 mr-10 min-w-full justify-end">
        <li>
          <a
            class="btn btn-ghost font-['SpaceGrotesk'] mt-2 pt-4 ml-3"
            href="#About"
          >
            About
          </a>
        </li>
        <li>
          <a
            class="btn btn-ghost font-['SpaceGrotesk'] mt-2 pt-4 ml-3"
            href="#GetStarted"
          >
            Get Started
          </a>
        </li>
        <li>
          <a
            class="btn btn-ghost font-['SpaceGrotesk'] mt-2 pt-4 ml-3"
            href="#FAQ"
          >
            FAQ
          </a>
        </li>

        <li>
          <a
            class="btn btn-ghost font-['SpaceGrotesk'] mt-2 pt-4 ml-3"
            href="#SignUp"
          >
            Sign Up
          </a>
        </li>

        <a
          class="font-['SpaceGrotesk'] flex items-center btn mt-2 ml-6 btn-outline btn-primary whitespace-nowrap"
          href="/agent"
        >
          Open App
        </a>
      </ul>
    </div>
    <div class="navbar-end hidden sm:block" />
  </div>
</div>
