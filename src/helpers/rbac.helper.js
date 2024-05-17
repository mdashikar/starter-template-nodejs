const roles = Object.freeze({
  SYS_ADMIN: 'SYS_ADMIN',
  USER: 'USER',
});

const resources = Object.freeze({
  USERS: 'USERS',
});

const adminRoles = [roles.SYS_ADMIN];

module.exports = {
  roles,
  resources,
  adminRoles,
};
