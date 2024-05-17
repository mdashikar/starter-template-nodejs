const express = require('express');
const docsRoute = require('./docs.route');
const authRoutes = require('./auth.route');

const router = express.Router();
const authMiddleware = require('../../middlewares/auth.middleware');

const publicRoutes = [
  {
    path: '/auth',
    route: authRoutes,
  },
];

const authGuardedRoutes = [];

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
