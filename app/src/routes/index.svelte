<script type="ts">
	import { reporter, ValidationMessage } from '@felte/reporter-svelte';
	import { validator } from '@felte/validator-zod';
	import LinkURL from 'components/LinkURL.svelte';
	import ConnectButton from 'components/web3/ConnectButton.svelte';
	import { LinkDocument, linkSchema, type LinkDocumentType } from 'db/models/Link';
	import { createForm } from 'felte';
	import FaRegCopy from 'svelte-icons/fa/FaRegCopy.svelte';
	import { selectedAccount } from 'svelte-web3';

	const { form, reset } = createForm({
		extend: [
			reporter,
			validator({
				schema: linkSchema
			})
		],
		async onSuccess(response: any) {
			const body: {
				success: boolean;
				linkDocument: LinkDocumentType;
			} = await response.json();
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
			<div><LinkURL /></div>

			<div class="flex flex-col p-2 justify-center items-center">
				<div class="py-4">Wait for your pCall</div>
				<button class="btn btn-primary">Wait for pCall</button>

				<div class="divider">OR</div>
				<div class="py-4">
					You can only have 1 pCall link active at a time. If you want to create a new one, click
					the button below.
				</div>
			</div>
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
			</div>
		</div>
	</div>
</div>
