import { GUNDB_PEER } from '$lib/constants';
import Gun from 'gun';
import 'gun/nts.js';

console.log('peers', GUNDB_PEER);

const peers = [GUNDB_PEER];

export const gun = Gun({ peers });
