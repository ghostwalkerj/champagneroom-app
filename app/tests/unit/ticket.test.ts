import 'dotenv/config';

import { nanoid } from 'nanoid';
import { generateSillyPassword } from 'silly-password-generator';

import { Creator, type CreatorDocument } from '$lib/models/creator';
import { Show, type ShowDocument } from '$lib/models/show';
import { Ticket, type TicketDocument } from '$lib/models/ticket';
import { User } from '$lib/models/user';
import { Wallet } from '$lib/models/wallet';

import { AuthType, CurrencyType, ShowStatus, UserRole } from '$lib/constants';

let creator: CreatorDocument;
let show: ShowDocument;
describe('createTicket', () => {
  beforeEach(async () => {
    const wallet = new Wallet();
    await wallet.save();

    const user = new User({
      name: 'test123',
      wallet: wallet._id,
      roles: [UserRole.CREATOR],
      authType: AuthType.PATH_PASSWORD,
      secret: nanoid(),
      password: `${generateSillyPassword({ wordCount: 2 })}${process.env.PASSWORD_SALT}`
    });
    await user.save();

    creator = new Creator({
      user: user._id
    }) as CreatorDocument;

    await creator.save();

    show = (await Show.create({
      name: 'test123',
      creator: creator._id,
      agent: creator.agent,
      price: {
        amount: 100,
        currency: CurrencyType.USD
      },
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
  });
  it('inserts and reads a ticket', async () => {
    const user = await User.create({
      name: 'test123',
      roles: [UserRole.TICKET_HOLDER],
      authType: AuthType.PIN,
      password: [1, 2, 5, 2, 3, 2, 4, 0].join('')
    });

    const ticket = (await Ticket.create({
      user: user._id,
      show: show._id,
      agent: show.agent,
      creator: show.creator,
      price: show.price
    })) as TicketDocument;

    // Check values
    expect(ticket).toBeTruthy();
    expect(ticket._id).toBeTruthy();
  });
});
