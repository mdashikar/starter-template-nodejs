const mongoose = require('mongoose');

module.exports = {
  dropDB: async () => mongoose.connection.dropDatabase(),
  closeDB: async () => mongoose.connection.close(),
  deleteAllCollection: async () =>
    Promise.all(Object.values(mongoose.connection.collections).map(async (collection) => collection.deleteMany({}))),
};
