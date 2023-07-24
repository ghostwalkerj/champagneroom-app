<script>
  import Footer from './Footer.svelte';
  import Navbar from './Navbar.svelte';
</script>

<div
  class="bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0F001A] to-[#000000]"
>
  <Navbar />
  <slot />
  <Footer />
</div>
