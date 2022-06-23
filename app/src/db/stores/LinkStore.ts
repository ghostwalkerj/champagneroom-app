import type { LinkType } from 'db/models/Link';
import { derived } from 'svelte/store';
import { selectedAccount } from 'svelte-web3';
import urlJoin from 'url-join';
const API_PATH = import.meta.env.VITE_API_URL;

const getLinkByAddress = async (address: string) => {
  const url = new URL(urlJoin(API_PATH, 'link/byAddress', address));

  const response = await fetch(url);
  const body = await response.json();

  if (body.success) {
    return body.linkDocument as LinkType;
  } else return {};
};
export const currentLink = derived(
  selectedAccount,
  ($selectedAccount, set) => {
    if ($selectedAccount) {
      getLinkByAddress($selectedAccount).then((link) => {
        set(link);
      });
    } else {
      set(null);
    }
  },
  null
);
