export enum ActorType {
  AGENT = 'AGENT',
  CREATOR = 'CREATOR',
  CUSTOMER = 'CUSTOMER',
  TIMER = 'TIMER',
  UNKNOWN = 'UNKNOWN',
  ARBITRATOR = 'ARBITRATOR'
}

export enum AuthType {
  SIGNING = 'SIGNING',
  PATH_PASSWORD = 'PATH PASSWORD',
  PIN = 'PIN',
  NONE = 'NONE',
  PATH = 'PATH',
  TOKEN = 'TOKEN'
}

export enum CancelReason {
  CREATOR_NO_SHOW = 'CREATOR NO SHOW',
  CUSTOMER_NO_SHOW = 'CUSTOMER NO SHOW',
  SHOW_RESCHEDULED = 'SHOW RESCHEDULED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
  CREATOR_CANCELLED = 'CREATOR CANCELLED',
  TICKET_PAYMENT_TIMEOUT = 'TICKET PAYMENT TIMEOUT',
  TICKET_PAYMENT_FAILED = 'TICKET PAYMENT FAILED',
  TICKET_PAYMENT_INVALID = 'TICKET PAYMENT INVALID'
}

export enum CurrencyType {
  USD = 'USD',
  ETH = 'ETH'
}

export enum DisputeDecision {
  NO_REFUND = 'NO REFUND',
  FULL_REFUND = 'FULL REFUND',
  PARTIAL_REFUND = 'PARTIAL REFUND'
}

export enum DisputeReason {
  ATTEMPTED_SCAM = 'ATTEMPTED SCAM',
  ENDED_EARLY = 'ENDED EARLY',
  LOW_QUALITY = 'LOW QUALITY',
  CREATOR_NO_SHOW = 'CREATOR NO SHOW',
  SHOW_NEVER_STARTED = 'SHOW NEVER STARTED'
}

export enum EarningsSource {
  SHOW_PERFORMANCE = 'SHOW PERFORMANCE',
  COMMISSION = 'COMMISSION',
  REFERRAL = 'REFERRAL'
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

export enum RefundReason {
  SHOW_CANCELLED = 'SHOW CANCELLED',
  CUSTOMER_CANCELLED = 'CUSTOMER CANCELLED',
  DISPUTE_DECISION = 'DISPUTE DECISION',
  UNKNOWN = 'UNKNOWN'
}

export enum UserRole {
  OPERATOR = 'OPERATOR',
  PUBLIC = 'PUBLIC',
  AGENT = 'AGENT',
  CREATOR = 'CREATOR',
  EXTERNAL = 'EXTERNAL',
  TICKET_HOLDER = 'TICKET HOLDER'
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
