import { env } from 'node:process';

import { nanoid } from 'nanoid';
import { generateSillyPassword } from 'silly-password-generator';

import { Creator, type CreatorDocument } from '$lib/models/creator';
import { Show, type ShowDocument } from '$lib/models/show';
import { User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import { AuthType, ShowStatus, UserRole } from '$lib/constants';

let creator: CreatorDocument;
describe('createShow', () => {
  beforeEach(async () => {
    const wallet = new Wallet();
    await wallet.save();

    const user = new User({
      name: 'test123',
      wallet: wallet._id,
      roles: [UserRole.CREATOR],
      authType: AuthType.PATH_PASSWORD,
      secret: nanoid(),
      password: `${generateSillyPassword({ wordCount: 2 })}${env.PASSWORD_SALT}`
    });
    await user.save();

    creator = new Creator({
      user: user._id
    }) as CreatorDocument;

    await creator.save();
  });
  it('inserts and reads a Show', async () => {
    const show = (await Show.create({
      name: 'test123',
      creator: creator._id,
      agent: creator.agent,
      coverImageUrl: creator.user.profileImageUrl,
      showState: {
        status: ShowStatus.BOX_OFFICE_OPEN,
        salesStats: {
          ticketsAvailable: 1
        }
      },
      creatorInfo: {
        name: creator.user.name,
        profileImageUrl: creator.user.profileImageUrl,
        averageRating: creator.feedbackStats.averageRating,
        numberOfReviews: creator.feedbackStats.numberOfReviews
      }
    })) as ShowDocument;
    // Check values
    expect(show).toBeTruthy();
    expect(show._id).toBeTruthy();
  });
});
