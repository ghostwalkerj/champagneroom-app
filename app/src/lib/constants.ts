import { CurrencyType } from './models/common';

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
  INVOICE = 'INVOICE',
  PAYOUT = 'PAYOUT',
  OTHER = 'OTHER',
  NONE = 'NONE'
}

export const currencyFormatter = (
  currency = CurrencyType.USD.toString(),
  _minimumFractionDigits?: number
) => {
  const minimumFractionDigits =
    _minimumFractionDigits || currency === CurrencyType.USD ? 0 : 8;
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'symbol',
    minimumFractionDigits
  });

  return formatter;
};

export const durationFormatter = (duration: number): string => {
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  const hoursString = hours > 0 ? `${hours}hr ` : '';
  const minuteString = minutes > 0 ? `${minutes}m` : '';
  const secondString = seconds > 0 ? `${seconds}s` : '';

  return `${hoursString} ${minuteString} ${secondString}`.trim();
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
