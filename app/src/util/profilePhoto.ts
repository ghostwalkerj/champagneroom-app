const MAX_PROFILE_NUMBER = 80;
const PROFILE_PAD = 5;
const PROFILE_IMAGE_EXTENSION = 'jpg';
const PROFILE_IMAGE_PREFIX = 'profile';

const getProfileImage = (name: string, defaultProfileImagePath: string) => {
  const code = [...name].reduce(
    (accumulator, char) => accumulator + (char.codePointAt(0) || 0),
    0
  );

  const profileNumber = ((code % MAX_PROFILE_NUMBER) + 1)
    .toString()
    .padStart(PROFILE_PAD, '0');

  return `${defaultProfileImagePath}/${PROFILE_IMAGE_PREFIX}-${profileNumber}.${PROFILE_IMAGE_EXTENSION}`;
};

export default getProfileImage;
