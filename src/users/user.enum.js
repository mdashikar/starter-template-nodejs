const roles = Object.freeze({
  SYS_ADMIN: 'SYS_ADMIN',
  USER: 'USER',
});

const status = Object.freeze({
  VERIFIED: 'VERIFIED',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  UNVERIFIED: 'UNVERIFIED',
  INVITED: 'INVITED',
  SUSPENDED: 'SUSPENDED',
});

const providers = Object.freeze({
  GOOGLE: 'GOOGLE',
  LOCAL: 'LOCAL',
});

module.exports = {
  roles,
  status,
  providers,
};
