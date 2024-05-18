const mongoose = require('mongoose');
const { db } = require('../config/config');
const logger = require('../utils/logger');

const connectDb = () => {
  const dbURL = db.url;
  const dbOptions = db.options;
  if (!dbURL) {
    logger.error('Mongo URL not set in env file or config.js');
    throw new Error('Mongo URL not set in env file or config.js');
  }

  mongoose.set('toObject', { virtuals: true });
  mongoose.set('toJSON', { virtuals: true });

  mongoose
    .connect(dbURL, dbOptions)
    .then(() => logger.info('Database connected!'))
    .catch((err) => logger.error(`FAILED to connect using mongoose. ${err}`));
};

module.exports = { connectDb };
