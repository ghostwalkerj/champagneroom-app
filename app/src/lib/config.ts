const Config = {
  Path: {
    show: '/app/show',
    ticket: '/app/ticket',
    pin: '/pin',
    auth: '/app/auth',
    agent: '/app/agent',
    creator: '/app/creator',
    signup: '/app/signup',
    operator: '/app/operator',
    imageUpload: '/api/v1/upload',
    showTime: '/showtime',
    notifyUpdate: '/api/v1/notify/update',
    notifyInsert: '/api/v1/notify/insert',
    staticUrl: 'https://static.champagneroom.app',
    app: '/app',
    openApp: '/app/creator',
    websiteUrl: 'https://champagneroom.app',
    api: '/api/v1'
  },
  UI: {
    defaultProfileImage: 'https://static.champagneroom.app/profile/default.png',
    profileImagePath: 'https://static.champagneroom.app/profile',
    defaultCommission: 10
  },
  TIMER: {
    gracePeriod: 600_000,
    escrowPeriod: 360_000,
    paymentPeriod: 6_000_000
  }
};

export default Config;
