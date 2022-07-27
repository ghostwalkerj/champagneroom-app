<script lang="ts">
	import type { Link } from '$lib/ORM/models/link';
	import FaMoneyBillWave from 'svelte-icons/fa/FaMoneyBillWave.svelte';
	import Image from 'svelte-image';
	import StarRating from 'svelte-star-rating';
	export let link: Link;
	$: rating = 0;

	const formatter = new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
		maximumFractionDigits: 0
	});
</script>

{#if link}
	<div
		class=" flex-shrink-0  mx-2 grid  p-4 py-8 gap-4 col-span-3 row-span-3 place-items-center lg:w-100 xl:mx-0"
	>
		<div class="text-center">
			<div class="font-extrabold text-lg">This pCall is For</div>
			<div class="font-extrabold text-3xl">{link.name}</div>
		</div>
		<div class="rounded-full flex-none h-48 w-48 mask-circle">
			<Image
				src={link.profileImageUrl}
				alt={link.name}
				height="48"
				width="48"
				class="rounded-full flex-none object-cover mask-circle"
			/>
		</div>
		<StarRating {rating} />

		<div class="stats stats-vertical stats-shadow lg:stats-horizontal">
			<div class="stat">
				<div class="text-primary w-10 stat-figure">
					<FaMoneyBillWave />
				</div>
				<div class="stat-title">Requested</div>
				<div class="text-primary stat-value">
					{formatter.format(Number.parseInt(link.amount))}
				</div>
			</div>

			<div class="stat">
				<div class="text-secondary w-10 stat-figure">
					<FaMoneyBillWave />
				</div>
				<div class="stat-title">Funded</div>
				<div class="text-secondary stat-value">
					{formatter.format(Number.parseInt(link.fundedAmount || '0'))}
				</div>
			</div>
		</div>
		<section
			class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-white text-center p-4 gap-4 items-center justify-center  md:gap-8 "
		>
			<div>Funding Address</div>
			<div class="break-all">{link.walletAddress}</div>
		</section>
	</div>
{/if}
