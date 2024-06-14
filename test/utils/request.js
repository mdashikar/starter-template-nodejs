const supertest = require('supertest');
const app = require('../../src/app');

module.exports = async ({ method, endpoint, token, body }) => {
  let request = supertest(app);

  switch (method) {
    case 'GET':
      request = request.get(endpoint);
      break;

    case 'POST':
      request = request.post(endpoint).send(body);
      break;

    case 'DELETE':
      request = request.delete(endpoint);
      break;

    default:
      throw new Error('Unsupported HTTP method!');
  }

  if (token) request = request.set('authorization', token);

  return request;
};
