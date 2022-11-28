<script lang="ts">
	import type { LinkDocType } from '$lib/ORM/models/link';
	import { currencyFormatter } from '$lib/util/constants';
	import spacetime from 'spacetime';
	import StarRating from 'svelte-star-rating';
	export let completedCalls: LinkDocType[];
</script>

<div class="bg-primary text-primary-content card">
	<div class="text-left card-body items-center">
		<h2 class="text-2xl card-title">Activity</h2>
		<h2 class="text-lg card-title">{completedCalls.length} Completed Calls</h2>

		<ul class="w-full">
			{#each completedCalls.slice(0, 9) as call}
				<li>
					<div class="flex flex-row w-full my-2">
						<div
							class="rounded-full flex mt-2 bg-blue-500 h-6 ring-white ring-8 w-6 items-center justify-center align-bottom"
						>
							<!-- Heroicon name: solid/check -->
							<svg
								class="h-5 text-white w-5"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 20 20"
								fill="currentColor"
								aria-hidden="true"
							>
								<path
									fill-rule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clip-rule="evenodd"
								/>
							</svg>
						</div>

						<div class="flex flex-col w-full">
							<div class="flex flex-row w-full place-content-between">
								<div class="text-sm text-gray-200 whitespace-nowrap ml-3">
									{#if call.linkState.finalized}
										{spacetime(call.linkState.finalized.endedAt).format('{month-short} {date-pad}')}
									{/if}
								</div>
								<div class="text-sm text-gray-200">
									{currencyFormatter.format(call.linkState.totalFunding)}
								</div>
							</div>
							<div class="flex  flex-row w-full">
								{#if call.linkState.feedback}
									<div class="ml-3 -mb-3">
										<StarRating rating={call.linkState.feedback.rating ?? 0} />
									</div>
								{/if}
							</div>
							{#if call.linkState.feedback && call.linkState.feedback.comment && call.linkState.feedback.comment.length > 0}
								<div class="text-sm text-gray-200 ml-3">
									"{call.linkState.feedback.comment}" - {call.linkState.claim?.caller}
								</div>
							{:else}
								<div class="text-sm text-gray-200 ml-3">
									{call.linkState.claim?.caller}
								</div>
							{/if}
						</div>
					</div>
				</li>
			{/each}
		</ul>
	</div>
</div>
