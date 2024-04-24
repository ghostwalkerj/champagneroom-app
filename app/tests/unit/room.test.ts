import { Room, type RoomDocument, SocialMediaType } from '$lib/models/room';

describe('createRoom', () => {
  it('inserts and reads a Room', async () => {
    const room = (await Room.create({
      name: 'test123'
    })) as RoomDocument;
    // Check values
    expect(room).toBeTruthy();
    expect(room._id).toBeTruthy();
  }),
    it('inserts and updates a Room with Social Links', async () => {
      const room = (await Room.create({
        name: 'test123'
      })) as RoomDocument;
      // Check values
      expect(room).toBeTruthy();
      expect(room._id).toBeTruthy();

      // Add social media links
      room.socialMediaLinks = [
        {
          type: SocialMediaType.Enum.FACEBOOK,
          link: 'https://facebook.com/username',
          displayUrl: 'https://facebook.com/username',
          icon: 'https://facebook.com/username/icon'
        }
      ];
      await room.save();

      // Check values
      expect(room.socialMediaLinks).toHaveLength(1);
      expect(room.socialMediaLinks[0].type).toBe(SocialMediaType.Enum.FACEBOOK);
    });
});
