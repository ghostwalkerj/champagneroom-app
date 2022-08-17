<script lang="ts">
	export let showFeedback = false;
</script>

<input type="checkbox" id="feedback-modal" class="modal-toggle" bind:checked={showFeedback} />
<div class="modal">
	<div class="modal-box">
		<div class="flex flex-row pt-4 gap-2 place-items-center justify-between">
			<div class="font-bold text-lg  ">pCall Feedback</div>

			<div class="modal-action">
				<label for="feedback-modal" class="btn">Close</label>
			</div>
		</div>
	</div>
</div>
