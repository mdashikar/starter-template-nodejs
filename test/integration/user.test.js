const { userPayload, sendRequest } = require('../utils');

describe('Auth Test Suit', () => {
  describe('POST /auth/register', () => {
    test('should create a new user', async () => {
      const user = userPayload();

      const response = await sendRequest({
        method: 'POST',
        endpoint: '/v1/auth/register',
        body: user,
      });

      expect(response.statusCode).toBe(201);
    });
  });
});
