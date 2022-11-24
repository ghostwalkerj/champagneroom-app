<script lang="ts">
	import { browser } from '$app/environment';
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		PUBLIC_DEFAULT_PROFILE_IMAGE,
		PUBLIC_ESCROW_PERIOD,
		PUBLIC_MOBILE_PATH,
		PUBLIC_ROOM_PATH,
		PUBLIC_TALENT_PATH
	} from '$env/static/public';
	import ProfilePhoto from '$lib/components/forms/ProfilePhoto.svelte';
	import { createLinkMachineService, type LinkMachineServiceType } from '$lib/machines/linkMachine';
	import { talentDB, type TalentDBType } from '$lib/ORM/dbs/talentDB';
	import type { LinkDocument } from '$lib/ORM/models/link';
	import type { TalentDocType, TalentDocument } from '$lib/ORM/models/talent';
	import { StorageTypes } from '$lib/ORM/rxdb';
	import { currencyFormatter } from '$lib/util/constants';
	import getProfileImage from '$lib/util/profilePhoto';
	import spacetime from 'spacetime';
	import FaMoneyBillWave from 'svelte-icons/fa/FaMoneyBillWave.svelte';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';
	import StarRating from 'svelte-star-rating';
	import urlJoin from 'url-join';
	import type { Subscription } from 'xstate';
	import type { PageData } from './$types';

	export let form: import('./$types').ActionData;
	export let data: PageData;
	const token = data.token;
	let talentObj = data.talent as TalentDocType;
	$: currentLink = data.currentLink as LinkDocument;
	let key = $page.params.key;

	const ESCROW_PERIOD = Number(PUBLIC_ESCROW_PERIOD || 3600000);
	const CALL_PATH = urlJoin(PUBLIC_MOBILE_PATH, PUBLIC_TALENT_PATH, 'call', key);

	let talent: TalentDocument;
	let linkService: LinkMachineServiceType;
	let linkSub: Subscription;
	let linkStateSub: Subscription;

	let linkMachineState =
		currentLink && createLinkMachineService(currentLink.linkState).getSnapshot();

	$: canCancelLink =
		linkMachineState &&
		linkMachineState.can({
			type: 'REQUEST CANCELLATION',
			cancel: undefined
		});

	$: canCreateLink =
		!currentLink ||
		(linkMachineState && linkMachineState.done) ||
		(linkMachineState && linkMachineState.matches('inEscrow'));

	$: waiting4StateChange = false;

	$: claim = (linkMachineState && linkMachineState.context.linkState.claim) || {
		caller: '',
		createdAt: '',
		call: {
			startedAt: undefined,
			endedAt: undefined
		}
	};

	$: callerProfileImage = getProfileImage(claim.caller);

	$: linkURL = currentLink && urlJoin($page.url.origin, PUBLIC_ROOM_PATH, currentLink._id);

	let tooltipOpen = '';
	const copyLink = () => {
		navigator.clipboard.writeText(linkURL);
		tooltipOpen = 'tooltip-open';
		setTimeout(() => (tooltipOpen = ''), 1000);
	};

	const useLinkState = (link: LinkDocument, linkState: LinkDocument['linkState']) => {
		if (linkService) linkService.stop();
		if (linkSub) linkSub.unsubscribe();

		linkService = createLinkMachineService(linkState, link.updateLinkStateCallBack());
		linkSub = linkService.subscribe(async (state) => {
			if (state.matches('claimed.canCall')) {
				if (linkService) linkService.stop();
				if (linkSub) linkSub.unsubscribe();
				if (linkStateSub) linkStateSub.unsubscribe();
				console.log('goto', CALL_PATH);
				await goto(CALL_PATH);
			}
			canCancelLink = state.can({
				type: 'REQUEST CANCELLATION',
				cancel: undefined
			});
			canCreateLink = state.done ?? true;

			linkMachineState = state;
		});
	};

	const useLink = (link: LinkDocument) => {
		currentLink = link;
		waiting4StateChange = false; // link changed, so can submit again
		useLinkState(link, link.linkState);
		linkStateSub = link.get$('linkState').subscribe((_linkState) => {
			waiting4StateChange = false; // link changed, so can submit again
			useLinkState(link, _linkState);
		});
	};

	const updateProfileImage = async (url: string) => {
		if (url && talent) {
			talent.update({
				$set: {
					profileImageUrl: url,
					updatedAt: new Date().getTime()
				}
			});
			if (currentLink) {
				currentLink.update({
					$set: {
						talentInfo: {
							...currentLink.talentInfo,
							profileImageUrl: url
						},
						updatedAt: new Date().getTime()
					}
				});
			}
		}
	};

	const onSubmit = ({ form }) => {
		waiting4StateChange = true;
		return async ({ result }) => {
			if (result.type !== 'success') {
				waiting4StateChange = false;
			} else {
				if (form) form.reset();
			}
			await applyAction(result);
		};
	};

	if (browser) {
		talentDB(token, key, StorageTypes.IDB).then((db: TalentDBType) => {
			db.talents
				.findOne(talentObj._id)
				.exec()
				.then((_talent) => {
					if (_talent) {
						talentObj = _talent;
						talent = _talent;
						talent.get$('currentLink').subscribe((linkId) => {
							if (linkId) {
								db.links
									.findOne(linkId)
									.exec()
									.then((link) => {
										if (link) useLink(link);
									});
							}
						});
					}
				});
		});
	}
</script>

<div class="min-h-full">
	<div class="space-y-6 lg:col-start-1 lg:col-span-2">
		<!-- Photo -->
		<div>
			<div class="lg:col-start-3 lg:col-span-1">
				<div class="bg-primary text-primary-content card">
					<div class="text-center card-body items-center">
						<h2 class="text-3xl card-title">{talentObj.name}</h2>
						<StarRating rating={talentObj.stats.ratingAvg ?? 0} />

						<div>
							<ProfilePhoto
								profileImage={talentObj.profileImageUrl || PUBLIC_DEFAULT_PROFILE_IMAGE}
								callBack={(value) => {
									updateProfileImage(value);
								}}
							/>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Link Detail -->
		{#if currentLink && linkMachineState && !linkMachineState.done}
			<div class="bg-primary text-primary-content card">
				<div class="text-center card-body items-center ">
					<div class="container mx-auto grid  gap-2 grid-row-2">
						<div class="text-center card-body items-center bg-secondary rounded-2xl">
							<div class="text-xl w-full">
								{#if linkMachineState.matches('unclaimed')}
									Your pCall Link has Not Been Claimed
								{:else if linkMachineState.matches('claimed')}
									<div class="w-full ">
										Your pCall Link was Claimed by:
										<div class="p-2 flex flex-col w-full place-content-evenly items-center">
											<div
												class="bg-cover bg-no-repeat bg-center rounded-full h-32 w-32"
												style="background-image: url('{callerProfileImage}')"
											/>
											<div>
												<div>{claim.caller}</div>
												<div>on</div>
												<div>{spacetime(claim.createdAt).format('nice-short')}</div>
											</div>
										</div>
									</div>
								{:else if linkMachineState.matches('inEscrow')}
									Your pCall Link is in Escrow until:
									<div class="p-6 flex flex-row w-full place-content-evenly items-center">
										<div>
											<div>
												{spacetime(
													(claim.call?.endedAt || claim.call?.startedAt || 0) + ESCROW_PERIOD
												).format('nice-short')}
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>

						<section
							class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-white text-center items-center justify-center"
						>
							<div class="stats stats-vertical stats-shadow md:stats-horizontal">
								<div class="stat">
									<div class="text-primary w-10 stat-figure">
										<FaMoneyBillWave />
									</div>
									<div class="stat-title">Amount Requested</div>
									<div class="text-primary stat-value">
										{currencyFormatter.format(currentLink.requestedAmount)}
									</div>
								</div>

								<div class="stat">
									<div class="text-secondary w-10 stat-figure">
										<FaMoneyBillWave />
									</div>
									<div class="stat-title">Total Funded</div>
									<div class="text-secondary stat-value">
										{currencyFormatter.format(linkMachineState.context.linkState.totalFunding || 0)}
									</div>
								</div>
							</div>
						</section>
						<section
							class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-white text-center p-4  items-center justify-center "
						>
							<div>Funding Address</div>
							<div class="break-all">{currentLink.fundingAddress}</div>
						</section>

						<section
							class="flex flex-col bg-base-100 rounded-2xl flex-shrink-0 text-center p-4 items-center justify-center bg-info text-accent-content "
						>
							<div>Unique pCall Link</div>
							<div class="break-all">
								{linkURL}
								<button on:click={copyLink}>
									<div class="cursor-pointer flex group">
										<div class="h-5 mr-1 mb-1 pl-2 group-hover:text-white">
											<FaRegCopy />
										</div>
										<div class="text-sm group-hover:text-white">
											<div class="tooltip tooltip-accent {tooltipOpen}" data-tip="Copied!" />
										</div>
									</div>
								</button>
							</div>
						</section>
					</div>
				</div>
			</div>
		{/if}

		<!-- Cancel Link -->
		{#if canCancelLink}
			<!-- Link Form-->
			<form method="post" action="?/cancel_link" use:enhance={onSubmit}>
				<div class="bg-primary text-primary-content card">
					<div class="text-center card-body items-center">
						<div class="text-2xl card-title">Cancel Your pCall Link</div>
						<div class="text xl">
							If you cancel this pCall link, the link will be deactivated and nobody can use it to
							call.
						</div>
						{#if linkMachineState.context.linkState.totalFunding > 0}
							{currencyFormatter.format(linkMachineState.context.linkState.totalFunding)} will be refunded
							to "{linkMachineState.context.linkState.claim?.caller}"
						{/if}

						<div class="flex flex-col text-white p-2 justify-center items-center">
							<div class="py-4">
								<button class="btn btn-secondary" type="submit" disabled={waiting4StateChange}
									>Cancel Link</button
								>
							</div>
						</div>
					</div>
				</div>
			</form>
		{:else if canCreateLink}
			<div class="bg-primary text-primary-content card">
				<div class="text-center card-body items-center">
					<h2 class="text-2xl card-title">Create a New pCall Link</h2>
					<div class="flex flex-col text-white p-2 justify-center items-center">
						<form method="post" action="?/create_link" use:enhance={onSubmit}>
							<div class="max-w-xs w-full py-2 form-control ">
								<!-- svelte-ignore a11y-label-has-associated-control -->
								<label for="price" class="label">
									<span class="label-text">Requested Amount in USD</span></label
								>
								<div class="rounded-md shadow-sm mt-1 relative">
									<div class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none">
										<span class="text-gray-500 sm:text-sm"> $ </span>
									</div>
									<input
										type="text"
										name="amount"
										class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
										placeholder="0.00"
										aria-describedby="price-currency"
										value={form?.amount ?? ''}
									/>
									<div
										class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none"
									>
										<span class="text-gray-500 sm:text-sm" id="price-currency"> USDC </span>
									</div>
								</div>
								{#if form?.missingAmount}<div class="shadow-lg alert alert-error">
										Amount is required
									</div>{/if}
								{#if form?.invalidAmount}<div class="shadow-lg alert alert-error">
										Invalid Amount
									</div>{/if}
							</div>

							<div class="py-4">
								<button class="btn btn-secondary" type="submit" disabled={waiting4StateChange}
									>Generate Link</button
								>
							</div>
						</form>
					</div>
				</div>
			</div>
		{:else if linkMachineState && linkMachineState.matches('claimed.requestedCancellation.waiting4Refund')}
			<div class="bg-primary text-primary-content card">
				<div class="text-center card-body items-center">
					<h2 class="text-2xl card-title">Issue Refund for Cancelled Link</h2>
					<div class="flex flex-col text-white p-2 justify-center items-center">
						<form method="post" action="?/send_refund" use:enhance={onSubmit}>
							<div class="max-w-xs w-full py-2 form-control ">
								<!-- svelte-ignore a11y-label-has-associated-control -->
								<label for="price" class="label">
									<span class="label-text"
										>Refund {linkMachineState.context.linkState.claim &&
											linkMachineState.context.linkState.claim.caller}</span
									></label
								>
								<div class="rounded-md shadow-sm mt-1 relative">
									<div class="flex pl-3 inset-y-0 left-0 absolute items-center pointer-events-none">
										<span class="text-gray-500 sm:text-sm"> $ </span>
									</div>
									<input
										type="text"
										name="amount"
										class=" max-w-xs w-full py-2 pl-6 input input-bordered input-primary "
										placeholder="0.00"
										aria-describedby="price-currency"
										value={form?.amount ?? ''}
									/>
									<div
										class="flex pr-3 inset-y-0 right-0 absolute items-center pointer-events-none"
									>
										<span class="text-gray-500 sm:text-sm" id="price-currency"> USDC </span>
									</div>
								</div>
								{#if form?.missingAmount}<div class="shadow-lg alert alert-error">
										Amount is required
									</div>{/if}
								{#if form?.invalidAmount}<div class="shadow-lg alert alert-error">
										Invalid Amount
									</div>{/if}
							</div>

							<div class="py-4">
								<button class="btn btn-secondary" type="submit" disabled={waiting4StateChange}
									>Send Refund</button
								>
							</div>
						</form>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
