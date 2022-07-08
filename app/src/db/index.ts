import Gun from 'gun';
import { GUNDB_PEER } from 'lib/constants';

export const gun = Gun({ radisk: false, localStorage: true });
