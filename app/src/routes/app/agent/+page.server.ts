/* eslint-disable @typescript-eslint/naming-convention */
import { error, fail, redirect, type RequestEvent } from '@sveltejs/kit';
import type { AxiosResponse } from 'axios';
import { Queue } from 'bullmq';
import type IORedis from 'ioredis';
import { nanoid } from 'nanoid';
import { generateSillyPassword } from 'silly-password-generator';
import spacetime from 'spacetime';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { uniqueNamesGenerator } from 'unique-names-generator';

import {
  AUTH_TOKEN_NAME,
  BITCART_API_URL,
  BITCART_EMAIL,
  BITCART_PASSWORD,
  PASSWORD_SALT,
  WEB3STORAGE_KEY,
  WEB3STORAGE_PROOF
} from '$env/static/private';

import type { AgentDocument } from '$lib/models/agent';
import type { CreatorDocument } from '$lib/models/creator';
import { Creator } from '$lib/models/creator';
import { Show } from '$lib/models/show';
import type { UserDocument } from '$lib/models/user';
import { User } from '$lib/models/user';
import type { WalletDocument } from '$lib/models/wallet';
import { Wallet } from '$lib/models/wallet';

import type { PayoutQueueType } from '$lib/workers/payoutWorker';

import config from '$lib/config';
import { AuthType, CurrencyType, EntityType } from '$lib/constants';
import { rateCryptosRateGet } from '$lib/ext/bitcart';
import {
  createBitcartToken,
  PayoutJobType,
  PayoutReason,
  requestPayoutSchema
} from '$lib/payout';
import {
  backupAuthToken,
  createAuthToken,
  setAuthToken
} from '$lib/server/auth';
import { web3Upload } from '$lib/server/upload';
import { womensNames } from '$lib/womensNames';

import type { Actions, PageServerLoad } from './$types';

export const actions: Actions = {
  request_payout: async ({ request, locals }) => {
    const form = await superValidate(request, zod(requestPayoutSchema));
    const { walletId, amount, destination, payoutReason, jobType } = form.data;

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const redisConnection = locals.redisConnection as IORedis;
      const payoutQueue = new Queue(EntityType.PAYOUT, {
        connection: redisConnection
      }) as PayoutQueueType;

      payoutQueue.add(jobType, {
        walletId,
        amount,
        destination,
        payoutReason
      });

      payoutQueue.close();
    } catch {
      return message(form, 'Error requesting payout');
    }
    return message(form, 'Payout requested successfully');
  },

  impersonateUser: async ({ request, cookies }) => {
    const data = await request.formData();
    const impersonateId = data.get('impersonateId') as string;
    const tokenName = AUTH_TOKEN_NAME || 'token';
    if (!impersonateId) {
      return fail(400, { impersonateId, missingId: true });
    }

    backupAuthToken(cookies, tokenName);
    const encAuthToken = createAuthToken({
      id: impersonateId,
      selector: '_id',
      authType: AuthType.IMPERSONATION
    });

    encAuthToken && setAuthToken(cookies, tokenName, encAuthToken);
    throw redirect(303, config.PATH.creator);
  },

  update_profile_image: async ({ locals, request }: RequestEvent) => {
    const data = await request.formData();
    const image =
      data.get('images') && (data.get('images') as unknown as [File]);

    const user = locals.user as UserDocument;
    if (!user) {
      throw error(404, 'User not found');
    }

    if (image instanceof File && image.size > 0) {
      // upload image to web3
      const url = await web3Upload(WEB3STORAGE_KEY, WEB3STORAGE_PROOF, image);
      User.updateOne(
        { _id: user._id },
        {
          $set: {
            profileImageUrl: url
          }
        }
      ).exec();

      return {
        success: true,
        imageUrl: url
      };
    }
  },

  create_creator: async ({ request }) => {
    const data = await request.formData();
    const agentId = data.get('agentId') as string;
    let name = data.get('name') as string;
    const commission = data.get('commission') as string;

    // Validation
    if (!name || name.length < 3 || name.length > 50) {
      name = uniqueNamesGenerator({
        dictionaries: [womensNames]
      });
    }
    if (Number.isNaN(+commission) || +commission < 0 || +commission > 100) {
      return fail(400, { commission, badCommission: true });
    }

    try {
      const password = generateSillyPassword({
        wordCount: 2
      });
      const secret = nanoid();

      const wallet = (await Wallet.create({})) as WalletDocument;

      const user = await User.create({
        name,
        authType: AuthType.PATH_PASSWORD,
        secret,
        wallet: wallet._id,
        roles: [EntityType.CREATOR],
        referralCode: nanoid(10),
        password: `${password}${PASSWORD_SALT}`,
        profileImageUrl: config.UI.defaultProfileImage
      });
      const creator = (await Creator.create({
        user: user._id,
        commissionRate: +commission,
        agent: agentId
      })) as CreatorDocument;
      return {
        success: true,
        creator: creator?.toJSON({
          flattenMaps: true,
          flattenObjectIds: true
        }),
        user: user?.toJSON({ flattenMaps: true, flattenObjectIds: true }),
        password
      };
    } catch (error: unknown) {
      console.error('err', error);
      if (error instanceof Error) {
        return fail(400, { err: error.toString() });
      }
      return fail(400, { err: error });
    }
  },

  update_creator: async ({ request }) => {
    const data = await request.formData();
    const creatorId = data.get('creatorId') as string;
    const name = data.get('name') as string;
    const commission = data.get('commission') as string;
    const active = data.get('active') as string;

    // Validation
    if (creatorId === null) {
      return fail(400, { creatorId, missingCreatorId: true });
    }
    if (Number.isNaN(+commission) || +commission < 0 || +commission > 100) {
      return fail(400, { commission, badCommission: true });
    }

    if (active !== 'true' && active !== 'false') {
      return fail(400, { active, badActive: true });
    }

    try {
      const creator = await Creator.findOneAndUpdate(
        {
          _id: creatorId
        },
        {
          commissionRate: +commission
        },
        {
          new: true
        }
      );
      if (!creator) {
        return fail(400, { creatorId, missingCreatorId: true });
      }

      await User.findOneAndUpdate(
        {
          _id: creator.user._id
        },
        {
          name,
          active: active === 'true'
        }
      );
    } catch (error) {
      console.error('err', error);
      if (error instanceof Error) {
        return fail(400, { err: error.toString() });
      }
    }

    return {
      success: true
    };
  },

  change_user_secret: async ({ request }) => {
    const data = await request.formData();
    const userId = data.get('userId') as string;

    const password = generateSillyPassword({
      wordCount: 2
    });

    // Validation
    if (userId === null) {
      return fail(400, { userId, missingUserId: true });
    }

    const secret = nanoid();
    const user = await User.findById(userId);
    if (!user) {
      return fail(400, { userId, missingUserId: true });
    }
    user.secret = secret;
    user.password = `${password}${PASSWORD_SALT}`;
    user.updateOne();

    return { success: true, secret, password };
  },

  update_agent: async ({ request, locals }) => {
    const data = await request.formData();
    const name = data.get('name') as string;
    const defaultCommissionRate = data.get('defaultCommissionRate') as string;
    const user = locals.user as UserDocument;
    const agent = locals.agent as AgentDocument;

    // Validation
    if (
      Number.isNaN(+defaultCommissionRate) ||
      +defaultCommissionRate < 0 ||
      +defaultCommissionRate > 100
    ) {
      return fail(400, { defaultCommissionRate, badCommission: true });
    }

    if (name !== user.name) {
      user.updateOne({ name }).exec();
    }

    if (agent.defaultCommissionRate !== +defaultCommissionRate) {
      agent
        .updateOne({
          defaultCommissionRate: +defaultCommissionRate
        })
        .exec();
    }

    return {
      success: true
    };
  },
  update_referral_code: async ({ locals }) => {
    const user = locals.user as UserDocument;
    user.referralCode = nanoid(10);
    user.updateOne({ referralCode: user.referralCode }).exec();

    return {
      success: true,
      referralCode: user.referralCode
    };
  }
};

export const load: PageServerLoad = async ({ locals }) => {
  const agent = locals.agent;
  const user = locals.user;
  const wallet = locals.wallet;
  if (!agent) {
    throw error(404, 'Agent not found');
  }

  if (!user) {
    throw error(404, 'User not found');
  }

  const creators = (await Creator.find({
    agent: agent._id
  })) as CreatorDocument[];

  const now = spacetime.now();

  const monthRange = {
    start: now.startOf('month').iso(),
    end: now.endOf('month').iso()
  };

  const showData = await Show.aggregate([
    {
      $match: {
        'showState.finalize.finalizedAt': {
          $gte: new Date(monthRange.start),
          $lte: new Date(monthRange.end)
        },
        agent: agent._id
      }
    },
    {
      $project: {
        'showState.salesStats.ticketSalesAmount': 1,
        creator: 1
      }
    },
    {
      $group: {
        _id: ['$creator', '$showState.salesStats.ticketSalesAmount.currency'],
        amount: {
          $sum: '$showState.salesStats.ticketSalesAmount.amount'
        }
      }
    }
  ]);

  const weekRange = {
    start: now.subtract(7, 'days').iso(),
    end: now.iso()
  };

  const weeklyData = await Show.aggregate([
    {
      $match: {
        'showState.finalize.finalizedAt': {
          $gte: new Date(weekRange.start),
          $lte: new Date(weekRange.end)
        },
        agent: agent._id
      }
    },
    {
      $project: {
        creator: 1,
        dayOfWeek: { $dayOfWeek: '$showState.finalize.finalizedAt' }
      }
    },
    {
      $group: {
        _id: ['$creator', '$dayOfWeek'],
        bookings: {
          $sum: 1
        }
      }
    }
  ]);

  let exchangeRate = { data: {} };

  if (wallet) {
    const token = await createBitcartToken(
      BITCART_EMAIL,
      BITCART_PASSWORD,
      BITCART_API_URL
    );

    exchangeRate =
      ((await rateCryptosRateGet(
        {
          currency: wallet.currency,
          fiat_currency: CurrencyType.USD
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )) as AxiosResponse<string>) || undefined;
  }

  const payoutForm = await superValidate(
    {
      amount: 0,
      destination: user.address,
      walletId: user.wallet!.toString(),
      payoutReason: PayoutReason.AGENT_PAYOUT,
      jobType: PayoutJobType.CREATE_PAYOUT
    },
    zod(requestPayoutSchema),
    { errors: false }
  );

  return {
    payoutForm,
    agent: agent.toJSON({ flattenMaps: true, flattenObjectIds: true }),
    user: user
      ? user.toJSON({ flattenMaps: true, flattenObjectIds: true })
      : undefined,
    creators: creators.map((creator) =>
      creator.toJSON({ flattenMaps: true, flattenObjectIds: true })
    ),
    wallet: wallet
      ? wallet.toJSON({ flattenMaps: true, flattenObjectIds: true })
      : undefined,
    exchangeRate: exchangeRate?.data,
    showData: showData.map(
      (show) =>
        ({
          creatorId: show._id[0].toString(),
          currency: show._id[1],
          amount: show.amount
        }) as { creatorId: string; currency: CurrencyType; amount: number }
    ),
    weeklyData: weeklyData.map(
      (show) =>
        ({
          creatorId: show._id[0].toString(),
          dayOfWeek: show._id[1],
          bookings: show.bookings
        }) as {
          creatorId: string;
          dayOfWeek: number;
          bookings: number;
        }
    )
  };
};
