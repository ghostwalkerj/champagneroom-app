export var TokenRoles;
(function (TokenRoles) {
    TokenRoles["ADMIN"] = "ADMIN";
    TokenRoles["PUBLIC"] = "PUBLIC";
    TokenRoles["AGENT"] = "AGENT";
    TokenRoles["TALENT"] = "TALENT";
})(TokenRoles || (TokenRoles = {}));
export var EntityType;
(function (EntityType) {
    EntityType["AGENT"] = "AGENT";
    EntityType["TALENT"] = "TALENT";
    EntityType["SHOW"] = "SHOW";
    EntityType["TICKET"] = "TICKET";
    EntityType["USER"] = "USER";
})(EntityType || (EntityType = {}));
export const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
});
export const durationFormatter = (duration) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const hoursString = hours > 0 ? `${hours}h ` : '';
    const minuteString = minutes > 0 ? `${minutes}m` : '';
    return `${hoursString} ${minuteString}`.trim();
};
export var ActorType;
(function (ActorType) {
    ActorType["AGENT"] = "AGENT";
    ActorType["TALENT"] = "TALENT";
    ActorType["CUSTOMER"] = "CUSTOMER";
    ActorType["SERVICE"] = "SERVICE";
    ActorType["TIMER"] = "TIMER";
})(ActorType || (ActorType = {}));
export const jitsiInterfaceConfigOverwrite = {
    MOBILE_APP_PROMO: false,
    TOOLBAR_BUTTONS: [
        'microphone',
        'camera',
        'fullscreen',
        'fodeviceselection',
        'hangup',
        'tileview',
    ],
};
