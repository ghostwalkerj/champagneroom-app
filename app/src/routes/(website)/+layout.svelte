<script>
  import Footer from './Footer.svelte';
  import Navbar from './Navbar.svelte';
</script>

<div
  class="bg-gradient-to-r from-[#0C082E] to-[#0C092E] font-Roboto min-h-screen"
>
  <div class="sticky top-0 z-40">
    <Navbar />
  </div>

  <div class="max-w-7xl m-auto">
    <slot />
  </div>

  <Footer />
</div>
