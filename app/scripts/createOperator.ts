import mongoose from 'mongoose';
import parseArgv from 'tiny-parse-argv';
import { User, UserRole } from './src/lib/models/user';
import { Operator } from './src/lib/models/operator';
import { Wallet } from './src/lib/models/wallet';
import { AuthType } from './src/lib/constants';
const arguments_ = parseArgv(process.argv);
const address = arguments_.address;
if (!address) throw new Error('No address provided');

const mongoDBEndpoint = arguments_.mongo || 'mongodb://localhost:27017';
await mongoose.connect(mongoDBEndpoint);

const wallet = new Wallet();
await wallet.save();

const user = await User.create({
  wallet: wallet._id,
  address: address,
  payoutAddress: address,
  authType: AuthType.SIGNING,
  name: 'Operator',
  roles: [UserRole.OPERATOR]
});

const operator = await Operator.create({
  user: user._id
});

console.log(`Operator created: ${operator._id}`);