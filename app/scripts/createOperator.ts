import { exit } from 'node:process';

import mongoose from 'mongoose';
import parseArgv from 'tiny-parse-argv';

import Config from '../src/lib/config';
import { AuthType, UserRole } from '../src/lib/constants';
import { Agent } from '../src/lib/models/agent';
import { Creator } from '../src/lib/models/creator';
import { Operator } from '../src/lib/models/operator';
import { User } from '../src/lib/models/user';
import { Wallet } from '../src/lib/models/wallet';
// eslint-disable-next-line @typescript-eslint/naming-convention
const arguments_ = parseArgv(process.argv, { string: ['address', 'mongo'] });
const address = arguments_.address;
console.log(`Creating Operator for address: ${address.toLowerCase()}`);
if (!address) throw new Error('No address provided');

const mongoDBEndpoint = arguments_.mongo || 'mongodb://localhost:27017';
await mongoose.connect(mongoDBEndpoint);

const wallet = new Wallet();
await wallet.save();

const user = await User.create({
  wallet: wallet._id,
  address: address.toLocaleLowerCase(),
  authType: AuthType.SIGNING,
  name: 'Operator',
  roles: [UserRole.OPERATOR, UserRole.AGENT, UserRole.CREATOR],
  permissions: Config.DEFAULT_PERMISSIONS[UserRole.OPERATOR]
});

const operator = await Operator.create({
  user: user._id
});

await Agent.create({
  user: user._id
});

await Creator.create({
  user: user._id
});

console.log(`Operator created: ${operator._id}`);

exit(0);
