const { OAuth2Client } = require('google-auth-library');

const {
  getUserById,
  getUserProfileById,
  getUserByRefreshToken,
  getUserByEmail,
  createUser,
  updateUserById,
  getUserByResetPassToken,
  getUserByVerifyEmailToken,
  deleteUserById,
} = require('./user.service');

const {
  status: { VERIFIED },
  providers: { GOOGLE },
} = require('./user.enum');
const { INTERNAL_SERVER_ERROR, UNPROCESSABLE_ENTITY, BAD_REQUEST } = require('../../utils/errors');
const { randomTokenString } = require('../../utils/generateTokenString');

const { sendVerificationEmail, sendPasswordResetEmail } = require('../../utils/sendEmail');
const logger = require('../../utils/logger');
const validationMessage = require('../../helpers/validationMessageFormatter.helper');
const hashPassword = require('../../helpers/hashPassword.helper');

const {
  google: { GOOGLE_OAUTH_CID },
} = require('../../config/config');

const {
  registerUserValidator,
  loginUserValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  verifyUserEmailValidator,
  updateUserProfileValidator,
} = require('./user.validator');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../../helpers/jwt.helper');

const retrieveUserFromGoogleToken = async (token) => {
  const client = new OAuth2Client(GOOGLE_OAUTH_CID);
  const ticket = await client.verifyIdToken({
    idToken: token,
    audience: GOOGLE_OAUTH_CID,
  });
  const { name, email, picture: avatar } = ticket.getPayload();
  return { name, email, avatar };
};

const generateTokens = async (user, cookies, res) => {
  const { id, role } = user;

  // Generate a new access token
  const accessToken = generateAccessToken({ user: { id, role } });

  // Generate a new refresh token
  const newRefreshToken = generateRefreshToken({ user: { id, role } });

  // Handle existing refresh tokens
  let newRefreshTokenArray = !cookies?.refreshToken
    ? user.refreshToken
    : user.refreshToken.filter((rt) => rt !== cookies.refreshToken);

  if (cookies?.refreshToken) {
    const { refreshToken } = cookies;
    const foundToken = await getUserByRefreshToken(refreshToken);

    // Detected refresh token reuse!
    if (!foundToken) {
      // Clear out ALL previous refresh tokens
      newRefreshTokenArray = [];
    }

    // Clear the existing refresh token cookie
    res.clearCookie('refreshToken');
  }

  // Store the new refresh token
  user.refreshToken = [...newRefreshTokenArray, newRefreshToken];
  await updateUserById(user.id, user);

  return { accessToken, newRefreshToken };
};

const registerUserHandler = async (req, res) => {
  try {
    const origin = req.get('origin') || 'http://localhost:3000';
    const { cookies } = req;
    const { name, email, password } = req.body;

    const validateUserRegisterInputs = registerUserValidator(req.body);

    if (validateUserRegisterInputs.error) {
      const validationError = validationMessage(validateUserRegisterInputs.error.details);

      return res.status(UNPROCESSABLE_ENTITY.code).json({
        message: UNPROCESSABLE_ENTITY.message,
        errors: validationError,
      });
    }
    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    // create verification token that expires after 24 hours
    const verificationToken = {
      token: randomTokenString(),
      expiresAt,
    };

    // Create a new user
    const user = await createUser({
      name,
      email,
      password,
      verificationToken,
    });

    const { accessToken, newRefreshToken } = await generateTokens(user, cookies, res);

    await sendVerificationEmail(user, origin);

    const maxAgeInDays = 10;
    const maxAgeInMilliseconds = maxAgeInDays * 24 * 60 * 60 * 1000;

    // Creates Secure Cookie with refresh token
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: maxAgeInMilliseconds,
    });
    const userProfile = await getUserProfileById(user._id);
    res.status(201).json({ success: true, message: 'User registered successfully', accessToken, user: userProfile });
  } catch (error) {
    logger.error(error);
    return res.status(INTERNAL_SERVER_ERROR.code).json({
      message: INTERNAL_SERVER_ERROR.message,
    });
  }
};

const loginUserHandler = async (req, res) => {
  try {
    const { cookies } = req;
    const { email, password } = req.body;

    const validateUserLoginInputs = loginUserValidator(req.body);

    if (validateUserLoginInputs.error) {
      const validationError = validationMessage(validateUserLoginInputs.error.details);

      return res.status(UNPROCESSABLE_ENTITY.code).json({
        message: UNPROCESSABLE_ENTITY.message,
        errors: validationError,
      });
    }
    const user = await getUserByEmail(email);

    // Check if the user exists and the password is correct
    if (!user || !(await user.isValidPassword(password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.provider === GOOGLE) {
      return res
        .status(400)
        .json({ message: 'Your account is registered with Google. Please login with your Google account.' });
    }

    const { accessToken, newRefreshToken } = await generateTokens(user, cookies, res);

    const maxAgeInDays = 10;
    const maxAgeInMilliseconds = maxAgeInDays * 24 * 60 * 60 * 1000;

    // Creates Secure Cookie with refresh token
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: maxAgeInMilliseconds,
    });

    // Send authorization access token to user
    res.json({ accessToken });
  } catch (error) {
    logger.error(error);
    return res.status(INTERNAL_SERVER_ERROR.code).json({
      message: INTERNAL_SERVER_ERROR.message,
    });
  }
};

const loginGoogleHandler = async (req, res) => {
  try {
    const { cookies } = req;
    const { credential } = req.body;
    if (!credential) {
      return res.status(UNPROCESSABLE_ENTITY.code).json({
        message: UNPROCESSABLE_ENTITY.message,
        error: 'Google auth credential required',
      });
    }
    const userDetails = await retrieveUserFromGoogleToken(credential);
    if (!userDetails) {
      return res.status(BAD_REQUEST.code).json({
        message: 'Something went wrong, try again!',
        success: false,
      });
    }

    const { email, name, avatar } = userDetails;

    const user = await getUserByEmail(email);

    if (!user) {
      const createdUser = await createUser({
        name,
        email,
        avatar,
        status: VERIFIED,
        provider: GOOGLE,
        verifiedAt: new Date(),
      });

      if (!createdUser) {
        return res.status(BAD_REQUEST.code).json({ success: true, message: 'Unable to register user at this moment.' });
      }

      const { accessToken, newRefreshToken } = await generateTokens(createdUser, cookies, res);

      const maxAgeInDays = 10;
      const maxAgeInMilliseconds = maxAgeInDays * 24 * 60 * 60 * 1000;

      // Creates Secure Cookie with refresh token
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        maxAge: maxAgeInMilliseconds,
      });
      const userProfile = await getUserProfileById(createdUser._id);
      return res
        .status(201)
        .json({ success: true, message: 'User registered successfully', accessToken, user: userProfile });
    }

    const { accessToken, newRefreshToken } = await generateTokens(user, cookies, res);

    const maxAgeInDays = 10;
    const maxAgeInMilliseconds = maxAgeInDays * 24 * 60 * 60 * 1000;

    // Creates Secure Cookie with refresh token
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: maxAgeInMilliseconds,
    });

    // Send authorization access token to user
    res.json({ accessToken });
  } catch (err) {
    logger.error(err);
    return res.status(INTERNAL_SERVER_ERROR.code).json({
      message: INTERNAL_SERVER_ERROR.message,
    });
  }
};

const userProfileHandler = async (req, res) => {
  try {
    const { id } = req.user;

    const user = await getUserProfileById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error(error);
    return res.status(INTERNAL_SERVER_ERROR.code).json({
      message: INTERNAL_SERVER_ERROR.message,
    });
  }
};

const updateUserProfileHandler = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await getUserById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { name, email, avatar, currentPassword, newPassword } = req.body;

    const validateUserLoginInputs = updateUserProfileValidator(req.body);

    if (validateUserLoginInputs.error) {
      const validationError = validationMessage(validateUserLoginInputs.error.details);

      return res.status(UNPROCESSABLE_ENTITY.code).json({
        message: UNPROCESSABLE_ENTITY.message,
        errors: validationError,
      });
    }

    // Update user fields if they exist in the request body
    if (name) user.name = name;
    if (email && user.email !== email) {
      const isEmailExits = await getUserByEmail(email);
      if (isEmailExits) {
        return res.status(BAD_REQUEST.code).json({
          message: 'This email already used by another user! Please try again with different email',
        });
      }
      user.email = email;
    }
    if (avatar) user.avatar = avatar;

    if (currentPassword) {
      // Check the current password
      const isPasswordValid = await user.isValidPassword(currentPassword);

      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Incorrect current password' });
      }
    }
    // Update the password if a new one is provided
    if (newPassword) {
      user.password = await hashPassword(newPassword);
    }

    const updatedUser = await updateUserById(user.id, user);

    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    logger.error(error);
    return res.status(INTERNAL_SERVER_ERROR.code).json({
      message: INTERNAL_SERVER_ERROR.message,
    });
  }
};

const refreshTokenHandler = async (req, res) => {
  try {
    const { cookies } = req;
    if (!cookies?.refreshToken) return res.sendStatus(401);
    const { refreshToken } = cookies;
    res.clearCookie('refreshToken');

    const user = await getUserByRefreshToken(refreshToken);
    // Detected refresh token reuse!
    if (!user) {
      const decodedToken = verifyRefreshToken(refreshToken);
      if (!decodedToken) {
        return res.sendStatus(403); // Forbidden
      }
      const hackedUser = await getUserById(decodedToken.user.id);
      hackedUser.refreshToken = [];
      await updateUserById(hackedUser.id, hackedUser);
      return res.sendStatus(403); // Forbidden
    }

    const newRefreshTokenArray = user.refreshToken.filter((rt) => rt !== refreshToken);
    const decodedToken = verifyRefreshToken(refreshToken);

    if (!decodedToken) {
      user.refreshToken = [...newRefreshTokenArray];
      await updateUserById(user.id, user);
    }
    if (!decodedToken || user.id !== decodedToken.user.id) return res.sendStatus(403);

    // create JWTs
    const { user: decodedUser } = decodedToken;

    const accessToken = generateAccessToken({ user: { ...decodedUser } });
    const newRefreshToken = generateRefreshToken({ user: { ...decodedUser } });

    // Saving refreshToken with current user
    user.refreshToken = [...newRefreshTokenArray, newRefreshToken];
    await updateUserById(user.id, user);
    const maxAgeInDays = 10;
    const maxAgeInMilliseconds = maxAgeInDays * 24 * 60 * 60 * 1000;

    // Creates Secure Cookie with refresh token
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: maxAgeInMilliseconds,
    });

    // Send authorization access token to user
    res.json({ accessToken });
  } catch (error) {
    logger.error(error);
    return res.status(INTERNAL_SERVER_ERROR.code).json({
      message: INTERNAL_SERVER_ERROR.message,
    });
  }
};

const logoutUserHandler = async (req, res) => {
  const { cookies } = req;
  if (!cookies?.refreshToken) return res.sendStatus(204); // No content
  const { refreshToken } = cookies;

  // Is refreshToken in db?
  const user = await getUserByRefreshToken(refreshToken);
  if (!user) {
    res.clearCookie('refreshToken');
    return res.sendStatus(204);
  }

  // Delete refreshToken in db
  user.refreshToken = user.refreshToken.filter((rt) => rt !== refreshToken);

  await updateUserById(user.id, user);

  res.clearCookie('refreshToken');
  res.sendStatus(200);
};

const verifyUserEmailHandler = async (req, res) => {
  try {
    const { token } = req.body;
    const validateVerifyUserEmailInputs = verifyUserEmailValidator(req.body);
    if (validateVerifyUserEmailInputs.error) {
      const validationError = validationMessage(validateVerifyUserEmailInputs.error.details);

      return res.status(UNPROCESSABLE_ENTITY.code).json({
        message: UNPROCESSABLE_ENTITY.message,
        errors: validationError,
      });
    }
    const user = await getUserByVerifyEmailToken(token);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (Date.now() > user.verificationToken.expiresAt) {
      return res.status(BAD_REQUEST.code).json({
        message: 'Verification token expired',
      });
    }

    user.verifiedAt = Date.now();
    user.verificationToken = undefined;
    user.status = VERIFIED;
    await updateUserById(user.id, user);
    res.json({ message: 'Verification successful, you can now login' });
  } catch (error) {
    logger.error(error);
    return res.status(INTERNAL_SERVER_ERROR.code).json({
      message: INTERNAL_SERVER_ERROR.message,
    });
  }
};

const forgotPasswordHandler = async (req, res) => {
  try {
    const origin = req.get('origin') || 'http://localhost:3000';
    const { email } = req.body;

    const validateForgotPasswordInputs = forgotPasswordValidator(req.body);
    if (validateForgotPasswordInputs.error) {
      const validationError = validationMessage(validateForgotPasswordInputs.error.details);

      return res.status(UNPROCESSABLE_ENTITY.code).json({
        message: UNPROCESSABLE_ENTITY.message,
        errors: validationError,
      });
    }
    const user = await getUserByEmail(email);

    // Check if the user exists
    if (!user) {
      return res.status(401).json({ message: 'User does not exists' });
    }
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    // create reset token that expires after 24 hours
    user.resetPasswordToken = {
      token: randomTokenString(),
      expiresAt,
    };
    await updateUserById(user.id, user);
    // send email
    await sendPasswordResetEmail(user, origin);
    res.json({ message: 'Please check your email for password reset instructions' });
  } catch (error) {
    logger.error(error);
    return res.status(INTERNAL_SERVER_ERROR.code).json({
      message: INTERNAL_SERVER_ERROR.message,
    });
  }
};

const resetPasswordHandler = async (req, res) => {
  try {
    const { token, password } = req.body;

    const validateResetPasswordInputs = resetPasswordValidator(req.body);
    if (validateResetPasswordInputs.error) {
      const validationError = validationMessage(validateResetPasswordInputs.error.details);

      return res.status(UNPROCESSABLE_ENTITY.code).json({
        message: UNPROCESSABLE_ENTITY.message,
        errors: validationError,
      });
    }
    const user = await getUserByResetPassToken(token);

    if (!user) return res.status(401).json({ message: 'Invalid token' });

    if (Date.now() > user.resetPasswordToken.expiresAt) {
      return res.status(BAD_REQUEST.code).json({
        message: 'Reset password token expired',
      });
    }

    user.password = await hashPassword(password);
    user.passwordResetAt = Date.now();
    user.resetPasswordToken = null;
    user.refreshToken = [];
    await updateUserById(user.id, user);
    res.json({ message: 'Password reset successful, you can now login' });
  } catch (error) {
    logger.error(error);
    return res.status(INTERNAL_SERVER_ERROR.code).json({
      message: INTERNAL_SERVER_ERROR.message,
    });
  }
};

const deleteUserHandler = async (req, res) => {
  try {
    const { id } = req.user;
    const user = await getUserById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await deleteUserById(user.id);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error(error);
    return res.status(INTERNAL_SERVER_ERROR.code).json({
      message: INTERNAL_SERVER_ERROR.message,
    });
  }
};

module.exports = {
  loginUserHandler,
  registerUserHandler,
  userProfileHandler,
  updateUserProfileHandler,
  refreshTokenHandler,
  logoutUserHandler,
  resetPasswordHandler,
  forgotPasswordHandler,
  verifyUserEmailHandler,
  loginGoogleHandler,
  deleteUserHandler,
};
