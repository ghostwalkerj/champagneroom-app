<script lang="ts">
  import type { WalletDocumentType } from '$lib/models/wallet';

  import { currencyFormatter } from '$lib/constants';

  export let wallet: WalletDocumentType;
</script>

<div class="bg-primary h-full text-primary-content w-full card">
  <div class="text-center card-body items-center p-3">
    <h2 class="text-2xl card-title">My Wallet</h2>

    <div class="bg-primary text-primary-content stats">
      <div class="stat">
        <div class="stat-title">Current balance</div>
        <div class="stat-value">
          {currencyFormatter(wallet.currency).format(wallet.balance)}
        </div>
        <div class="stat-actions">
          <button class="btn btn-sm">Withdraw</button>
        </div>
      </div>
    </div>
  </div>
</div>
