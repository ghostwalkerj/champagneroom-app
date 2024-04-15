import { UserRole } from './constants';
import { PermissionType } from './permissions';

export const defaultPermissions = {
  [UserRole.OPERATOR]: [PermissionType.FULL],
  [UserRole.AGENT]: [
    PermissionType.IMPERSONATE_CREATOR,
    PermissionType.CREATE_CREATOR,
    PermissionType.CREATE_PAYOUT,
    PermissionType.UPDATE_PROFILE
  ],
  [UserRole.CREATOR]: [
    PermissionType.CREATE_SHOW,
    PermissionType.UPDATE_PROFILE,
    PermissionType.CANCEL_SHOW,
    PermissionType.CREATE_PAYOUT
  ],
  [UserRole.TICKET_HOLDER]: [PermissionType.CREATE_TICKET]
};

const config = {
  PATH: {
    show: '/app/show',
    ticket: '/app/ticket',
    pin: '/pin',
    auth: '/app/auth',
    agent: '/app/agent',
    creator: '/app/creator',
    room: '/app/room',
    signup: '/app/signup',
    referralSignup: '/app/signup/',
    agentSignup: '/app/signup/',
    creatorSignup: '/app/signup/',
    signout: '/app/signout',
    revert: '/app/revert',
    operator: '/app/operator',
    imageUpload: '/api/v1/upload',
    notifyUpdate: '/api/v1/notify/update',
    notifyInsert: '/api/v1/notify/insert',
    staticUrl: 'https://static.champagneroom.app',
    app: '/app',
    openApp: '/app',
    websiteUrl: 'https://champagneroom.app',
    api: '/api/v1'
  },
  UI: {
    defaultProfileImage: 'https://static.champagneroom.app/profile/default.png',
    profileImagePath: 'https://static.champagneroom.app/profile',
    defaultCommissionRate: 10
  },
  TIMER: {
    gracePeriod: 600_000,
    escrowPeriod: 360_000,
    paymentPeriod: 6_000_000
  },
  DEFAULT_PERMISSIONS: defaultPermissions
};

export default config;
