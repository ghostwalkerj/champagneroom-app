<script lang="ts">
  import type { Agent } from '$lib/ORM/schemas/agent';

  export let agent: typeof Agent;
</script>

<div class="bg-primary h-full text-primary-content w-full card p-2">
  <div class="text-center card-body items-center">
    <h2 class="text-2xl card-title">My Wallet</h2>

    <div class="bg-primary text-primary-content stats">
      <div class="stat">
        <div class="stat-title">Account balance</div>
        <div class="stat-value">$89,400</div>
        <div class="stat-actions">
          <button class="btn btn-sm btn-success">Add funds</button>
        </div>
      </div>

      <div class="stat">
        <div class="stat-title">Current balance</div>
        <div class="stat-value">$89,400</div>
        <div class="stat-actions">
          <button class="btn btn-sm">Withdrawal</button>
          <button class="btn btn-sm">deposit</button>
        </div>
      </div>
    </div>
  </div>
</div>
