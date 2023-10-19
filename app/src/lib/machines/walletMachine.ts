import { Types } from 'mongoose';
import { nanoid } from 'nanoid';
import { assign, createMachine, interpret, type StateFrom } from 'xstate';

import type { EarningsType, PayoutType } from '$lib/models/common.js';
import type { ShowDocumentType } from '$lib/models/show.js';
import { type WalletDocumentType, WalletStatus } from '$lib/models/wallet.js';

enum WalletMachineEventString {
  SHOW_EARNINGS_POSTED = 'SHOW EARNINGS POSTED',
  PAYOUT_REQUESTED = 'PAYOUT REQUESTED'
}

export type WalletMachineEventType =
  | {
      type: 'SHOW EARNINGS POSTED';
      show: ShowDocumentType;
    }
  | {
      type: 'PAYOUT REQUESTED';
      payout: PayoutType;
    };

export type WalletMachineOptions = {
  atomicUpdateCallback?: (
    query: object,
    update: object
  ) => Promise<WalletDocumentType>;
};

export type WalletMachineServiceType = ReturnType<
  typeof createWalletMachineService
>;

export type WalletMachineStateType = StateFrom<typeof createWalletMachine>;

export type WalletMachineType = ReturnType<typeof createWalletMachine>;

export { WalletMachineEventString };

const createWalletMachine = ({
  wallet,
  options
}: {
  wallet: WalletDocumentType;
  options?: WalletMachineOptions;
}) => {
  /** @xstate-layout N4IgpgJg5mDOIC5SwBYHsDuBZAhgYxQEsA7MAOlUwBk0cJIBiAbQAYBdRUABzVkIBdCaYpxAAPRACYWADjIBOSQEYZAdnkAWFgDZt8pfNUAaEAE9EAVhlKyF+dtXrJMjVe0yAvh5OVs+IqQU6Bg0dIxMShxIIDx8gsKiEgjKcooq6lq6+oYm5ggyirYsAMwl2hYskhpKxUpePsG4BCTkvqH0EMySUdy8AkIi0UkGqSkZOnoGxmaISpKqRSwsSu4G2nOa9SC+TQGtwe3hxT0xffGDoMMyo+maE9nTedaLJcWOcxbatVs7-i1B1FoHWYGhOsX6CSGUhUCjGdyyU1ysxUFjIkgsFlqelcki+Fh+jT+gTaQPCFjBZwGiUskiRCGK1nkZA08gsyg0GlU2mqLgJmF2-xJYU6TG0FLiVKhyRhaTU8MmORmCCUnMkZFUsi0MgsrnkLFUxT5fmaxIOpJFqnFEIu4ikslht0yCseswsMI1LmUSjZBmcRoFpsBwuYMit52pCG0tKVxXKLHVrjmqlxKNU-qJ5BIAFFYHgAE6YBgAZQAEgB5ADqAAIAGIASQAcgBBKh1gBaWYAIqww5LLogowtuToNAVKvYqnTY+jbCirNIHCzDd5toSTZniDn84Wa1muwAhJsAYQA0lWAEpZo9ZusANS7PdE4PDUtUShsbNkUc+FUk8mKU6cjYshqH+ybVDq6brmQ2a5gWGAMLuB7Hmel7XneD6RE+lKQv2CDJmqHLzAyrLKOo8hTm8GhkHiFjqEsXJssuDT8hmZAAEZoGIZYAGY8YQeBgGWXBgMQDBHk2DbXlQVBNgAKnWZYNlWjZ1gp8kPuw2ESrhtr5NGeRVJ8ZAsPo7KSFUOiSFBewcVxvH8YJwmieJknSbJClKSpDZqXWGndlh0TPn2elKJUdLKG66qyMUf4yLGKxpiuvzQZx3F8QJQkiWJCmnlmckXlmRZZue97dlpQU4TaSQOKi+olKZ6KsqoMgGYgqgaGqmJxl8MiVN8yVrrZaUOZlzk5XWeUFZexWlZhva6Uk0hviZGh6Os-UOPFdLZGi5TuCOBiaPig2sal9kZU52UMLlJ75YVs23vJinKQpWBZmWACqcmPpVOnVXaLUKHR+rlAUVgUUqrVqtY6Kfv+COeKdxrDRdjlZS5t33RJUlZjJmkLQD0rvuqBpAUufXlHSybaGQxR2BopT-t1b42f8I2XRjE1TVWRZllQ5WExG7K01GcwsDq8gFLGGh0lGTJ6vLLKGPFlRs4EHPo+NxbltWRZyU255yQT2nWhGyYReRJmGG6mQstY2jq+QmtjddWPTVmNafQ2nYm39ZtSsouI0W+9jWMm8iaHSmLFMymJKAa8WKHRJ0sSj7No5lR4ADa8IwpaVrzBtG37vT-RGtUmRqTNNXRrV0jUJTqhiuLVLFOpqE7dnpejOd5507sPSVT2ea9dbvV9P0VWXAd4e4dXV41dh121+TlAonVciROjzl3LuCX3sCMIPOPuaXpzl1K89Vw1yfNfXSpS0yxQspUKrLLImJ75nB+50fA+TTugVPmAtfozxfHhFUegaLFBfiwaoeo3hcmpvYWwysVQ1DrtUb+Pcs5-2PoA+6l4vY+3PsFRaswORMncJ1JqfU-wASVBqeMpktoYjUBHJGacAzOx-mAQ+jBT54w8i9byvl-JgIvrPPSigIqwLVDQgoqg7COEcDg0av9+6uVxjJZ6XlVLqWNgFIWV9YoKBkA4Aw9NXgyAimtEySx+pzHmBiRQXdYD8BwHmfg+ddZF0NkYyR5CiZ9TkPMEoEE7iaCUBFNQNgWTKNqFYEcndkY8IoJ47xgjPr6zLO9c8VYABSZZGxkKqubVByx0T0wSesWWSpnDSAUDbbQ+oyat3cZknxnQjw5LknkkqVYqCeyniYvCfVUQVC-G+b0nJOqWw1MyG2pRtQRK+J0rx3SdaF1yQABV2WUy+eFPhMglmtMOljjoRWarYOinVZBhQZHUNJbEPFoC4CJToBc9bF0CdPKREC9InJMjqdaFjQ6uFiesMgYVN5LH-HKTp7zPnbOrFmUhgtTaAqSBbGMGJqJ-imOUVw9M6JdxIP0HA3Sjw4GIIJbO2cqUDDIBgHA-RiBQEkOeMAPEACuxBOjEO9p2MRhjDnSJqn1dU+0ORzIlgYCKCdCIvz1G6TQ1QWrkuIJS6ltL6WMvODBbVggqWQG5XygVN1CEexIb7TF-tsWzAsvE+OjhWoJP-IqqKHp6a6HlioLVOrIA0rpWABlTLhBGqDRAc1-KAE8yFRiiIYy9JqFRIoQwGDSXvkYYZWQCxpAuFqmBF+SUVzEDQPQeA0QUp7CxSFJIABabQdJm0OMcR2jtfoXnQSFB0etFCEDzKVO+eKRQ2RvlgcdNkXc8B6rDdnSAA6ibeisOqF+jMpa1BmRFFRtgbaM2xPFDqWqtzwWXRGWKwEWo1CliUdEKopx2CZCyCoa1rGM3il3fixAcDZ0IAALyXQ6htiBrCpEUBZAoBQmounpKopZTEVTxVKPTdRnNxoXqlLC050GtBvm5BOhulR4xvmuKZAwSwlzod7vgiAWG8KjjkE4FWegJbLEVE8KWDjUNsk0L6rhq4zq2Q8Zs4D4DQNDpVHTKWa1rAqDeNcephlDBqlZDoaGmbU5CfTsSfgyLxMAskxY5jYV7DpDsH+FtMZ3yokwZLTUdFrI9tshSk1urQ3hsBcEiMa1qKlCAiRyyDCG6RyZB6RmbwrCci-S5-4bnCCmogCG-VEbiAsrZYIDlXKeVxoY0CuYdN4FviC1oP8irWQKHfGtVx74-yBvc8G+dXnmUJaS7GgV+WkiaDkPtZwFjaidSloq64NF1jrHdVGWMXgvBAA */
  return createMachine(
    {
      context: {
        wallet,
        errorMessage: undefined,
        id: nanoid()
      },
      tsTypes: {} as import('./walletMachine.typegen.d.ts').Typegen0,
      schema: {
        events: {} as WalletMachineEventType
      },
      predictableActionArguments: true,
      id: 'walletMachine',
      initial: 'walletLoaded',

      states: {
        walletLoaded: {
          always: [
            {
              target: 'available',
              cond: 'walletAvailable'
            },
            {
              target: 'payoutRequested',
              cond: 'walletInPayout'
            }
          ]
        },
        available: {
          on: {
            'SHOW EARNINGS POSTED': {
              actions: 'showEarningsPosted'
            },
            'PAYOUT REQUESTED': {
              actions: 'payoutRequested',
              target: 'payoutRequested'
            }
          }
        },
        payoutRequested: {}
      }
    },
    {
      actions: {
        showEarningsPosted: assign((context, event) => {
          const wallet = context.wallet;
          const show = event.show;
          const earnings = wallet.earnings;
          const hasShow = earnings.findIndex(
            (earning) => earning.show._id.toString() === show._id.toString()
          );
          if (hasShow === -1) {
            const amount =
              show.showState.salesStats.totalRevenue.get(wallet.currency) || 0;
            const earning = {
              earnedAt: new Date(),
              show: show._id,
              amount,
              currency: wallet.currency,
              _id: new Types.ObjectId()
            } as EarningsType;
            if (options?.atomicUpdateCallback) {
              options.atomicUpdateCallback(
                {
                  id: wallet._id.toString(),
                  'earnings.show': { $ne: show._id }
                },
                {
                  $inc: [{ balance: amount }, { availableBalance: amount }],
                  $push: {
                    earnings: earning
                  }
                }
              );
            }
            wallet.earnings.push(earning);
            wallet.balance += amount;
            wallet.availableBalance += amount;
          }
          return {
            wallet
          };
        }),

        payoutRequested: assign((context, event) => {
          const wallet = context.wallet;
          const payout = event.payout;
          wallet.status = WalletStatus.PAYOUT_IN_PROGRESS;
          wallet.payouts.push(payout);
          return {
            wallet
          };
        })
      },
      guards: {
        walletAvailable: (context) =>
          context.wallet.status === WalletStatus.AVAILABLE,
        walletInPayout: (context) =>
          context.wallet.status === WalletStatus.PAYOUT_IN_PROGRESS
      }
    }
  );
};

export { createWalletMachine };
export const createWalletMachineService = ({
  wallet,
  walletMachineOptions
}: {
  wallet: WalletDocumentType;
  walletMachineOptions?: WalletMachineOptions;
}) => {
  const walletMachine = createWalletMachine({
    wallet,
    options: walletMachineOptions
  });
  walletMachine;
  const walletService = interpret(walletMachine).start();

  return walletService;
};
