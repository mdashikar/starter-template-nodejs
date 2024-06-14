const { faker } = require('@faker-js/faker');
const hashPassword = require('../../src/helpers/hashPassword.helper');
const User = require('../../src/modules/users/user.model');

module.exports = {
  userPayload: (args) => {
    const { name = faker.person.fullName(), email = faker.internet.email(), password = 'Xo7L7JXfdPE$j*B' } = args ?? {};

    return { name, email, password };
  },
  createUser: async () => {
    const password = 'Xo7L7JXfdPE$j*B';

    const payload = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: await hashPassword(password),
    };

    const newUser = await User.create(payload);
    newUser.password = password;
    return newUser;
  },
};
