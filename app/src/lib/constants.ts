export enum ActorType {
  AGENT = 'AGENT',
  CREATOR = 'CREATOR',
  CUSTOMER = 'CUSTOMER',
  TIMER = 'TIMER',
  UNKNOWN = 'UNKNOWN',
  ARBITRATOR = 'ARBITRATOR'
}

export enum EntityType {
  AGENT = 'AGENT',
  CREATOR = 'CREATOR',
  SHOW = 'SHOW',
  TICKET = 'TICKET',
  USER = 'USER',
  OPERATOR = 'OPERATOR',
  OTHER = 'OTHER',
  NONE = 'NONE'
}

/* eslint-disable @typescript-eslint/naming-convention */
export enum TokenRoles {
  ADMIN = 'ADMIN',
  PUBLIC = 'PUBLIC',
  AGENT = 'AGENT',
  CREATOR = 'CREATOR'
}

export const currencyFormatter = (currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  });

  return formatter;
};

export const durationFormatter = (duration: number): string => {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const hoursString = hours > 0 ? `${hours}hr ` : '';
  const minuteString = minutes > 0 ? `${minutes}m` : '';
  return `${hoursString} ${minuteString}`.trim();
};

export const jitsiInterfaceConfigOverwrite = {
  MOBILE_APP_PROMO: false,

  TOOLBAR_BUTTONS: [
    'microphone',
    'camera',
    'fullscreen',
    'fodeviceselection',
    'tileview'
  ],

  APP_NAME: 'Champagne Room'
};
