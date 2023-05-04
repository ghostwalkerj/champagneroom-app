<script lang="ts">
  import type { TalentDocType } from 'pshared/src/ORM/models/talent';
  export let talent: TalentDocType;
</script>

<div class="bg-primary h-full text-primary-content w-full card">
  <div class="text-center card-body items-center p-3">
    <h2 class="text-2xl card-title">My Wallet</h2>

    <div class="bg-primary text-primary-content stats">
      <div class="stat">
        <div class="stat-title">Current balance</div>
        <div class="stat-value">$8,940</div>
        <div class="stat-actions">
          <button class="btn btn-sm">Withdraw</button>
        </div>
      </div>
    </div>
  </div>
</div>
