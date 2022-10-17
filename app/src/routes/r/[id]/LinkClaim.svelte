<script lang="ts">
	import { enhance } from '$app/forms';
	import type { LinkDocType } from '$lib/ORM/models/link';
	export let link: LinkDocType;

	export let form: import('./$types').ActionData;
</script>

<!-- Link Form-->
<div class="bg-primary text-primary-content card">
	<div class="text-center card-body items-center">
		<h2 class="text-2xl card-title">Claim pCall Link</h2>
		<div class="flex flex-col text-white p-2 justify-center items-center">
			<form method="post" action="?/claim" use:enhance>
				<div class="max-w-xs w-full py-2 form-control ">
					<!-- svelte-ignore a11y-label-has-associated-control -->
					<label for="name" class="label">
						<span class="label-text">Name you want shown</span></label
					>
					<div class="rounded-md shadow-sm mt-1 relative">
						<div class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none">
							<span class="text-gray-500 sm:text-sm"> $ </span>
						</div>
						<input
							name="name"
							type="text"
							class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
							value={form?.name ?? ''}
						/>
						<input type="text" name="name" />
						{#if form?.missing}<div class="shadow-lg alert alert-error">Name is required</div>{/if}
					</div>
				</div>
				<div class="py-4">
					<button class="btn btn-secondary" type="submit">Claim Link</button>
				</div>
			</form>
		</div>
	</div>
</div>
