const crypto = require('crypto');

const randomTokenString = () => {
  return crypto.randomBytes(40).toString('hex');
};

module.exports = {
  randomTokenString,
};
