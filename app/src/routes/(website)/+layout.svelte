<script>
  import Footer from './Footer.svelte';
  import Navbar from './Navbar.svelte';
</script>

<div class="bg-black">
  <Navbar />
  <slot />
  <Footer />
</div>
