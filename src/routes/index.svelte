<script type="ts">
	import { reporter, ValidationMessage } from '@felte/reporter-svelte';
	import { validator } from '@felte/validator-yup';
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import { createForm } from 'felte';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';
	import { selectedAccount } from 'svelte-web3';
	import * as yup from 'yup';

	const schema = yup.object({
		name: yup.string().min(3).max(20).required(),
		amount: yup.number().integer().min(0).max(10000).required()
	});

	let pCallLink = '';
	let hasLink = false;

	const clearLink = () => {
		pCallLink = '';
		hasLink = false;
	};

	const copyLink = () => {
		navigator.clipboard.writeText(pCallLink);
	};

	const { form, reset } = createForm<yup.InferType<typeof schema>>({
		extend: [
			reporter,
			validator({
				schema
			})
		],
		async onSuccess(response: any) {
			const body: {
				success: boolean;
				link: string;
			} = await response.json();

			pCallLink = body.link;
			hasLink = true;
			reset();
		},
		onerror(err: any) {
			console.log(err);
		}
	});
</script>

<div class="min-h-screen-md bg-base-100 hero">
	<div class="text-center hero-content">
		<div class="max-w-lg">
			<h1 class="font-bold text-5xl">Request a pCall</h1>
			<p class="py-6">
				Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam. Posuit eam ad opus nunc et
				adepto a pCall!
			</p>
			{#if hasLink}
				<div class="flex flex-col p-2 justify-center items-center">
					<div class="bg-primary text-primary-content card">
						<div class="card-body">
							<h2 class="card-title">Here is your unique pCall link</h2>
							<div class="text-left">{pCallLink}</div>
							<div class="pt-4 card-actions justify-end">
								<button on:click={copyLink}>
									<div class="cursor-pointer flex group">
										<div class="h-5 mr-1 mb-1 pl-2 group-hover:text-white">
											<FaRegCopy />
										</div>
										<div class="text-sm text-gray-200 group-hover:text-white">Copy link</div>
									</div>
								</button>
							</div>
						</div>
					</div>

					<div class="py-4">Wait for your pCall</div>
					<button class="btn btn-primary" on:click={clearLink}>Wait for pCall</button>

					<div class="divider">OR</div>
					<div class="py-4">
						You can only have 1 pCall link active at a time. If you want to create a new one, click
						the button below.
					</div>
					<button class="btn btn-primary" on:click={clearLink}>Generate New Link</button>
				</div>
			{:else if $selectedAccount}
				<div class="flex flex-col p-2 justify-center items-center">
					<form use:form method="post">
						<input type="hidden" name="address" id="address" value={$selectedAccount} />
						<div class="max-w-xs w-full py-2 form-control">
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="label">
								<span class="label-text">Name to Show Caller</span>
							</label>
							<input
								type="text"
								id="name"
								name="name"
								placeholder="Enter a name"
								class="max-w-xs w-full py-2 input input-bordered input-primary"
							/>
							<ValidationMessage for="name" let:messages={message}>
								<span>{message}</span>
								<span slot="placeholder" />
							</ValidationMessage>
						</div>
						<div class="max-w-xs w-full form-control">
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="label">
								<span class="label-text">Requested Amount in USD</span>
							</label>
							<input
								type="number"
								id="amount"
								name="amount"
								placeholder="Enter an amount"
								class="max-w-xs w-full input input-bordered input-primary"
							/>
							<ValidationMessage for="amount" let:messages={message}>
								<span>{message}</span>
								<span slot="placeholder" />
							</ValidationMessage>
						</div>
						<div class="py-4">
							<button class="btn btn-primary" type="submit">Generate Link</button>
						</div>
					</form>
					{pCallLink}
				</div>
			{:else}
				<ConnectButton />
			{/if}
		</div>
	</div>
</div>
