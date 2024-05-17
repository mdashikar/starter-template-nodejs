const { Router } = require('express');

const router = Router();

const {
  registerUserHandler,
  loginUserHandler,
  loginGoogleHandler,
  refreshTokenHandler,
  verifyUserEmailHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  logoutUserHandler,
} = require('../../users/user.controller');

router.post('/login', loginUserHandler);
router.post('/login/google', loginGoogleHandler);
router.get('/logout', logoutUserHandler);
router.post('/register', registerUserHandler);
router.get('/token', refreshTokenHandler);

router.post('/verify-email', verifyUserEmailHandler);
router.post('/forgot-password', forgotPasswordHandler);
router.post('/reset-password', resetPasswordHandler);
module.exports = router;
