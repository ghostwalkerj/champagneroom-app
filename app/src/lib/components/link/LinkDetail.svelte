<script lang="ts">
	import { currencyFormatter } from '$lib/constants';
	import type { LinkDocType } from '$lib/ORM/models/link';
	import FaMoneyBillWave from 'svelte-icons/fa/FaMoneyBillWave.svelte';
	import StarRating from 'svelte-star-rating';
	export let link: LinkDocType;
	$: rating = 0;
</script>

{#if link}
	<div
		class=" flex-shrink-0  mx-2 grid  p-4 py-8 gap-4 col-span-3 row-span-3 place-items-center lg:w-100 xl:mx-0"
	>
		<div class="text-center">
			<div class="font-extrabold text-lg">This pCall is For</div>
			<div class="font-extrabold text-3xl">{link.talentName}</div>
		</div>
		<div
			class="bg-cover bg-no-repeat bg-center rounded-full h-48 w-48"
			style="background-image: url('{link.profileImageUrl}')"
		/>

		<StarRating {rating} />

		<div class="stats stats-vertical stats-shadow lg:stats-horizontal">
			<div class="stat">
				<div class="text-primary w-10 stat-figure">
					<FaMoneyBillWave />
				</div>
				<div class="stat-title">Requested</div>
				<div class="text-primary stat-value">
					{currencyFormatter.format(link.amount)}
				</div>
			</div>

			<div class="stat">
				<div class="text-secondary w-10 stat-figure">
					<FaMoneyBillWave />
				</div>
				<div class="stat-title">Funded</div>
				<div class="text-secondary stat-value">
					{currencyFormatter.format(link.fundedAmount)}
				</div>
			</div>
		</div>
		<section
			class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-white text-center p-4  items-center justify-center "
		>
			<div>Funding Address</div>
			<div class="break-all">{link.walletAddress}</div>
		</section>
	</div>
{/if}
