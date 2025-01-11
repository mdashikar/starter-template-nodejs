const express = require('express');
const docsRoute = require('./docs.route');
const authRoutes = require('./auth.route');
const userRoutes = require('./user.route');
const { authMiddleware } = require('../../middlewares');

const router = express.Router();

const publicRoutes = [
  {
    path: '/auth',
    route: authRoutes,
  },
];

const authGuardedRoutes = [
  {
    path: '/users',
    route: userRoutes,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

publicRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

authGuardedRoutes.forEach((route) => {
  router.use(route.path, authMiddleware, route.route);
});

devRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
