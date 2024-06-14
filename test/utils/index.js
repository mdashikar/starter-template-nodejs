const userUtils = require('./user');
const sendRequest = require('./request');

module.exports = { sendRequest, ...userUtils };
