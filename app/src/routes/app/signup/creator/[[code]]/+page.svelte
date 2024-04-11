<script lang="ts">
  import { onMount } from 'svelte';

  $: innerWidth = 0;
  $: innerHeight = 0;

  onMount(async () => {
    randomizeCardPositions();
  });

  function randomizeCardPositions() {
    const cards = document.querySelectorAll('.card') as unknown as [
      HTMLElement
    ];
    let positions: { x: number; y: number; width: number; height: number }[] =
      [];

    for (const [index, card] of cards.entries()) {
      let x: number,
        y: number,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        overlap: boolean,
        attempts = 0;
      do {
        overlap = false;
        // Adjust random position to consider card dimensions
        x = Math.random() * (innerWidth - card.offsetWidth - 500);
        y = Math.random() * (700 - card.offsetHeight);

        // Enhanced overlap check
        for (const pos of positions) {
          if (
            x < pos.x + pos.width &&
            x + card.offsetWidth > pos.x &&
            y < pos.y + pos.height &&
            y + card.offsetHeight > pos.y
          ) {
            overlap = true;
          }
        }

        // Boundary check for viewport
        if (
          x < 0 ||
          y + card.offsetHeight > innerHeight ||
          x + card.offsetWidth > innerWidth
        ) {
          overlap = true;
        }

        attempts++;
        if (attempts > 50) {
          // Adjust position for offscreen cards
          x =
            index > 0 ? positions[index - 1].x + positions[index - 1].width : 0;
          y = index > 0 ? positions[index - 1].y : 0;
          if (x + card.offsetWidth > innerWidth) {
            x = 0;
            y += card.offsetHeight;
          }
          break;
        }
      } while (overlap);

      // Apply the adjusted position
      card.style.left = `${x}px`;
      card.style.top = `${y}px`;
      card.style.display = 'flex';

      // Store the new position
      positions.push({
        x,
        y,
        width: card.offsetWidth,
        height: card.offsetHeight
      });
    }
  }
</script>

ya<svelte:window bind:innerWidth bind:innerHeight />

<div
  class="flex w-full flex-col place-content-center text-center text-base-100"
>
  <h1 class="mt-10 text-3xl font-bold text-primary">
    Join Our Creator Community and Thrive Globally
  </h1>

  <div>
    <div class="absolute left-auto top-auto max-w-md">
      <div
        class="card z-10 hidden transform rounded-lg border border-secondary border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-center text-xl text-secondary">
          Get Paid Quickly in Your Local Currency
        </h2>
        <div class=" card-body text-primary">
          Experience the ease of receiving payments swiftly and securely, right
          in your local currency. No more exchange rate headaches or delays.
        </div>
      </div>
    </div>
    <div class="absolute left-auto top-auto max-w-md">
      <div
        class=" card z-10 hidden transform rounded-lg border border-secondary border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-center text-xl text-secondary">
          Hassle-Free Payment Handling
        </h2>
        <div class=" card-body text-primary">
          Our streamlined payment system means you focus on creating, not on
          payment issues. We handle the complexities, you enjoy the rewards.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class=" card z-10 hidden transform rounded-lg border border-secondary border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-center text-xl text-secondary">
          Privacy is Our Priority
        </h2>
        <div class=" card-body text-primary">
          Your safety matters. With us, your personal details stay private. No
          need to share names or phone numbers.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class=" card z-10 hidden transform rounded-lg border border-secondary border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-center text-xl text-secondary">
          Earn More with Fan Tips
        </h2>
        <div class=" card-body text-primary">
          Connect with your audience in a meaningful way. Receive appreciation
          through tips directly from your fans.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class=" card z-10 hidden transform rounded-lg border border-secondary border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-center text-xl text-secondary">
          Exclusive Marketplace for Custom Content
        </h2>
        <div class=" card-body text-primary">
          Unlock the potential of your creativity. Sell unique, custom content
          directly to your followers and boost your earnings.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class=" card z-10 hidden transform rounded-lg border border-secondary border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-center text-xl text-secondary">
          Global Reach, Local Comfort
        </h2>
        <div class=" card-body text-primary">
          Wherever you are, connect with affluent customers from around the
          world. Your location is no longer a barrier to your success.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class=" card z-10 hidden transform rounded-lg border border-secondary border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-center text-xl text-secondary">
          Premium Prices for International Customers
        </h2>
        <div class=" card-body text-primary">
          Maximize your earnings by setting competitive rates for international
          clients. Benefit from a wider, more lucrative market.
        </div>
      </div>
    </div>

    <div class="absolute left-auto top-auto max-w-md">
      <div
        class=" card z-10 hidden transform rounded-lg border border-secondary border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-center text-xl text-secondary">
          Concierge Service at Your Fingertips
        </h2>
        <div class=" card-body text-primary">
          Need assistance? Our concierge service is here to help you navigate
          and optimize your creator experience with ease.
        </div>
      </div>
    </div>

    <div class="visible absolute left-auto top-auto max-w-md">
      <div
        class=" card z-10 hidden transform rounded-lg border border-secondary border-opacity-50 bg-gradient-to-r from-[#0C082E] to-[#0C092E] p-5 shadow-2xl transition-transform duration-300 hover:z-50 hover:scale-125"
      >
        <h2 class="text-center text-xl text-secondary">Join Us Now</h2>
        <div class=" card-body text-primary">
          Ready to take your creative journey to the next level? Sign up today
          and be part of a community that values and empowers creators like you.
        </div>
      </div>
    </div>
  </div>
</div>
