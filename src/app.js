const express = require('express');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { authLimiter } = require('./middlewares/rateLimiter.middleware');
const routes = require('./routes/v1');
const { NOT_FOUND } = require('./utils/errors');

const app = express();

if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

// set security HTTP headers
app.use(helmet());

// middleware for cookies
app.use(cookieParser());

// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(mongoSanitize());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

app.get('/health', async (_, res) => {
  res.send('Server is Healthy!');
});

// send back a 404 error for any unknown api request
app.use((req, res) => {
  res.status(NOT_FOUND.code).send(NOT_FOUND.message);
});

module.exports = app;
