<script lang="ts">
	import StarRating from 'svelte-star-rating';
	export let row;

	$: rating = row.rating;
</script>

{#key row.id}
	<div class="flex">
		<div class="pr-5 ">
			{rating.toFixed(1)}
		</div>
		{#if rating > 0 && rating <= 5}
			<StarRating {rating} />
		{/if}
	</div>
{/key}
