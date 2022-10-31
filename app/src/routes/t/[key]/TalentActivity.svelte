<script lang="ts">
	import type { LinkDocType } from '$lib/ORM/models/link';
	import { currencyFormatter } from '$lib/util/constants';
	import spacetime from 'spacetime';
	export let completedCalls: LinkDocType[];
</script>

<div class="bg-primary text-primary-content card">
	<div class="text-left card-body items-center">
		<h2 class="text-2xl card-title">Activity</h2>
		<h2 class="text-lg card-title">{completedCalls.length} Completed Calls</h2>

		<div class="mt-6 flow-root">
			<ul class="-mb-8">
				{#each completedCalls.slice(0, 9) as call}
					<li>
						<div class="pb-8 relative">
							<div class="flex space-x-5 relative">
								<div>
									<span
										class="rounded-full flex bg-blue-500 h-8 ring-white ring-8 w-8 items-center justify-center"
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
									</span>
								</div>
								<div class="flex space-x-4 flex-1 min-w-0 pt-1.5 justify-between">
									<div>
										<p class="text-sm text-gray-200">
											Completed pCall for {currencyFormatter.format(call.linkState.totalFunding)}
										</p>
									</div>
									<div class="text-right text-sm text-gray-200 whitespace-nowrap">
										{#if call.linkState.finalized}
											{spacetime(call.linkState.finalized.endedAt).format(
												'{month-short} {date-pad}'
											)}
										{/if}
									</div>
								</div>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		</div>
	</div>
</div>
