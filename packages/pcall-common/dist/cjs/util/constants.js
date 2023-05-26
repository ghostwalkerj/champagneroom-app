"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PUBLIC_DEFAULT_PROFILE_IMAGE = exports.PUBLIC_MONGO_FIELD_SECRET = exports.MONGO_DB_ENDPOINT = exports.redisOptions = exports.jitsiInterfaceConfigOverwrite = exports.ActorType = exports.durationFormatter = exports.currencyFormatter = exports.TokenRoles = void 0;
var TokenRoles;
(function (TokenRoles) {
    TokenRoles["ADMIN"] = "ADMIN";
    TokenRoles["PUBLIC"] = "PUBLIC";
    TokenRoles["AGENT"] = "AGENT";
    TokenRoles["TALENT"] = "TALENT";
})(TokenRoles = exports.TokenRoles || (exports.TokenRoles = {}));
exports.currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
});
const durationFormatter = (duration) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    const hoursString = hours > 0 ? `${hours}h ` : "";
    const minuteString = minutes > 0 ? `${minutes}m` : "";
    return `${hoursString} ${minuteString}`.trim();
};
exports.durationFormatter = durationFormatter;
var ActorType;
(function (ActorType) {
    ActorType["AGENT"] = "AGENT";
    ActorType["TALENT"] = "TALENT";
    ActorType["CUSTOMER"] = "CUSTOMER";
    ActorType["SERVICE"] = "SERVICE";
    ActorType["TIMER"] = "TIMER";
})(ActorType = exports.ActorType || (exports.ActorType = {}));
exports.jitsiInterfaceConfigOverwrite = {
    MOBILE_APP_PROMO: false,
    TOOLBAR_BUTTONS: [
        "microphone",
        "camera",
        "fullscreen",
        "fodeviceselection",
        "hangup",
        "tileview",
    ],
};
exports.redisOptions = {
    connection: {
        host: process.env.REDIS_HOST || "",
        port: process.env.REDIS_PORT || 6379,
        username: process.env.REDIS_USERNAME || "",
        password: process.env.REDIS_PASSWORD || "",
        enableReadyCheck: false,
    },
};
exports.MONGO_DB_ENDPOINT = process.env.MONGO_DB_ENDPOINT || "";
exports.PUBLIC_MONGO_FIELD_SECRET = process.env.PUBLIC_MONGO_FIELD_SECRET || "";
exports.PUBLIC_DEFAULT_PROFILE_IMAGE = process.env.PUBLIC_DEFAULT_PROFILE_IMAGE;
