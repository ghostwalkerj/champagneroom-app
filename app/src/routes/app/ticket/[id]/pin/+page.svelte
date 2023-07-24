<script lang="ts">
  import { enhance } from '$app/forms';

  import type { ActionData } from './$types';

  export let form: ActionData;
</script>

<div class="mt-6 flex items-center">
  <div class="min-w-full">
    <div class="flex justify-center">
      <div
        class="flex flex-col w-full p-4 max-w-fit gap-4 rounded-xl bg-base-200 overflow-auto"
      >
        <form method="post" action="?/set_pin" use:enhance>
          <div class="max-w-xs w-full py-2 form-control">
            <div class="max-w-xs w-full py-2 form-control">
              <label for="pin" class="label">
                <span class="label-text">8 Digit Pin</span></label
              >
              <div class="rounded-md shadow-sm mt-1 relative">
                <input
                  name="pin"
                  type="text"
                  class="max-w-xs w-full py-2 pl-6 input input-bordered input-primary"
                  value={form?.pin ?? ''}
                  minlength="8"
                  maxlength="8"
                />
                {#if form?.missingPin}<div class="shadow-lg alert alert-error">
                    Pin is required
                  </div>{/if}
                {#if form?.invalidPin}<div class="shadow-lg alert alert-error">
                    Pin must be 8 digits
                  </div>{/if}
                <div class="text-center text-sm p-1">
                  You need a pin to see this ticket
                </div>
              </div>
            </div>

            <div class="py-4 text-center">
              <button class="btn btn-primary" type="submit">Submit</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</div>
