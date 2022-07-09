import Gun from 'gun';
import { GUNDB_PEER } from 'lib/constants';

console.log('peers', GUNDB_PEER);
export const gun = Gun({ peers: [GUNDB_PEER] });
