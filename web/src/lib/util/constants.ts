export enum TokenRoles {
  ADMIN,
  PUBLIC,
  AGENT,
  TALENT,
}

export const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const durationFormatter = (duration: number): string => {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const hoursString = hours > 0 ? `${hours}h ` : '';
  const minuteString = minutes > 0 ? `${minutes}m` : '';
  return `${hoursString} ${minuteString}`.trim();
};

export enum ActorType {
  AGENT,
  TALENT,
  CUSTOMER,
}

export const jitsiConfigOverwrite = {
  prejoinPageEnabled: false,
  disablePolls: true,
  hideLobbyButton: true,
  hideEmailInSettings: true,
  readOnlyName: true,
  gravatar: {
    disabled: true,
  },
  notifications: [],
};

export const jitsiInterfaceConfigOverwrite = {
  TOOLBAR_BUTTONS: [
    'microphone',
    'camera',
    'fullscreen',
    'fodeviceselection',
    'hangup',
    'tileview',
  ],
};
