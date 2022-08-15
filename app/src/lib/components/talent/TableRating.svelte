<script lang="ts">
	import StarRating from 'svelte-star-rating';
	export let row;

	const rating = row.rating;
</script>

<div class="flex">
	<div class="pr-5 ">
		{rating}
	</div>
	<StarRating {rating} />
</div>
