const { db } = require('../src/config/config');
const { connectDB, dropDB, closeDB, deleteAllCollection } = require('../src/db');

const dbURL = `${db.url}-test`;

beforeAll(async () => {
  connectDB(dbURL);
});

afterAll(async () => {
  await dropDB();
  await closeDB();
});

beforeEach(async () => {
  await deleteAllCollection();
});
