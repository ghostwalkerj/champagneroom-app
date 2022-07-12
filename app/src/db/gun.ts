import Gun from 'gun';
import { GUNDB_PEER, LOCAL_GUNDB_PEER } from 'lib/constants';

console.log('peers', GUNDB_PEER);

const peers = [GUNDB_PEER];
if (LOCAL_GUNDB_PEER) {
	peers.push('http://localhost:8080/gun');
}
export const gun = Gun({ peers });
