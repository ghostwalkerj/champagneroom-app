<script>
  import Footer from './Footer.svelte';
  import Navbar from './Navbar.svelte';
</script>

<div class="bg-gradient-to-r from-indigo-900 to-[#000000]">
  <Navbar />
  <slot />
  <Footer />
</div>
