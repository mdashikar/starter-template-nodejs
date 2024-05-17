const { AccessControl } = require('accesscontrol');
const { roles, resources } = require('./rbac.helper');

const { SYS_ADMIN, USER } = roles;

const { USERS } = resources;

const ac = new AccessControl();
const allResources = Object.values(resources);

// prettier-ignore
ac.grant(USER)
    .read([USERS])

ac.grant(SYS_ADMIN).create(allResources).read(allResources).update(allResources).delete(allResources);

module.exports = ac;
