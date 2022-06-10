<script type="ts">
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import { selectedAccount } from 'svelte-web3';
	import { createForm } from 'felte';
	import { reporter, ValidationMessage } from '@felte/reporter-svelte';
	import { validator } from '@felte/validator-yup';
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

<div class="min-h-screen bg-base-200 hero">
	<div class="text-center hero-content">
		<div class="max-w-md">
			<h1 class="font-bold text-5xl">Request a pCall</h1>
			<p class="py-6">
				Pretioso flos est, nihil ad vos nunc. Posset faciens pecuniam. Posuit eam ad opus nunc et
				adepto a pCall!
			</p>
			{#if hasLink}
				<div class="flex flex-col p-2 justify-center items-center">
					<div>Here is your unique pCall link:</div>
					<div>
						{pCallLink}
					</div>
					<div>You can request a new link by clicking the button below. This link will expire.</div>
					<button class="btn btn-primary" on:click={clearLink}>Generate New Link</button>
				</div>
			{:else if $selectedAccount}
				<div class="flex flex-col p-2 justify-center items-center">
					<form use:form method="post">
						<input type="hidden" name="address" id="address" value={$selectedAccount} />
						<div class="max-w-xs w-full form-control">
							<!-- svelte-ignore a11y-label-has-associated-control -->
							<label class="label">
								<span class="label-text">Name to Show Caller</span>
							</label>
							<input
								type="text"
								id="name"
								name="name"
								placeholder="Enter a name"
								class="max-w-xs w-full input input-bordered input-primary"
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
