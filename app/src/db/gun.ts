import Gun from 'gun';
import 'gun/nts.js';
import { GUNDB_PEER } from 'lib/constants';

console.log('peers', GUNDB_PEER);

const peers = [GUNDB_PEER];

export const gun = Gun({ peers });
