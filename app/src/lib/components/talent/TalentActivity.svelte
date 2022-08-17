<script lang="ts">
	import { currencyFormatter } from '$lib/constants';
	import type { TalentStats } from '$lib/ORM/models/talent';
	export let talentStats: TalentStats;
</script>

<div class="bg-primary text-primary-content card">
	<div class="text-left card-body items-center">
		<h2 class="text-2xl card-title">Activity</h2>

		<div class="mt-6 flow-root">
			<ul class="-mb-8">
				<li>
					<div class="pb-8 relative">
						<span
							class="h-full -ml-px bg-gray-200 top-4 left-4 w-0.5 absolute"
							aria-hidden="true"
						/>
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
										Completed pCall with <span class="font-medium text-gray-900">Ted Cruz</span>
										for {currencyFormatter.format(300)}
									</p>
								</div>
								<div class="text-right text-sm text-gray-200 whitespace-nowrap">
									<time datetime="2020-09-28">Sep 28</time>
								</div>
							</div>
						</div>
					</div>
				</li>

				<li>
					<div class="pb-8 relative">
						<span
							class="h-full -ml-px bg-gray-200 top-4 left-4 w-0.5 absolute"
							aria-hidden="true"
						/>
						<div class="flex space-x-5 relative">
							<div>
								<span
									class="rounded-full flex bg-blue-500 h-8 ring-white ring-8 w-8 items-center justify-center"
								>
									<!-- Heroicon name: solid/thumb-up -->
									<svg
										class="h-5 text-white w-5"
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										aria-hidden="true"
									>
										<path
											d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z"
										/>
									</svg>
								</span>
							</div>
							<div class="flex space-x-4 flex-1 min-w-0 pt-1.5 justify-between">
								<div>
									<p class="text-sm text-gray-100">
										You received feedback from <span class="font-medium text-gray-900"
											>Ted Cruiz (not related to Ted Cruz)</span
										>
									</p>
								</div>
								<div class="text-right text-sm text-gray-100 whitespace-nowrap">
									<time datetime="2020-09-30">Sep 30</time>
								</div>
							</div>
						</div>
					</div>
				</li>

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
										Completed pCall with <span href="#" class="font-medium text-gray-900"
											>Tedward Cruz</span
										>
										for {currencyFormatter.format(500)}
									</p>
								</div>
								<div class="text-right text-sm text-gray-200 whitespace-nowrap">
									<time datetime="2020-10-04">Oct 4</time>
								</div>
							</div>
						</div>
					</div>
				</li>
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
										Completed pCall with <span href="#" class="font-medium text-gray-900"
											>Zed Cruz</span
										>
										for {currencyFormatter.format(500)}
									</p>
								</div>
								<div class="text-right text-sm text-gray-200 whitespace-nowrap">
									<time datetime="2020-10-04">Oct 4</time>
								</div>
							</div>
						</div>
					</div>
				</li>
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
										Completed pCall with <span href="#" class="font-medium text-gray-900"
											>Ed Cruz</span
										>
										for {currencyFormatter.format(500)}
									</p>
								</div>
								<div class="text-right text-sm text-gray-200 whitespace-nowrap">
									<time datetime="2020-10-04">Oct 4</time>
								</div>
							</div>
						</div>
					</div>
				</li>
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
										Completed pCall with <span href="#" class="font-medium text-gray-900"
											>Fred Cruz</span
										>
										for {currencyFormatter.format(500)}
									</p>
								</div>
								<div class="text-right text-sm text-gray-200 whitespace-nowrap">
									<time datetime="2020-10-04">Oct 4</time>
								</div>
							</div>
						</div>
					</div>
				</li>
			</ul>
		</div>
	</div>
</div>
