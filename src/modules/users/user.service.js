const User = require('./user.model');

const createUser = async (inputs) => {
  return User.create(inputs);
};

const getUserById = async (id) => {
  const user = await User.findById(id);
  return user;
};

const getUserProfileById = async (id) => {
  const user = await User.findById(id).select('-password -refreshToken -verificationToken -resetPasswordToken').lean();

  return user;
};

const getUserByEmail = async (email) => {
  const user = await User.findOne({
    email,
  });
  return user;
};

const getUserByRefreshToken = async (refreshToken) => {
  return User.findOne({ refreshToken }).exec();
};

const getUserByResetPassToken = async (resetPasswordToken) => {
  return User.findOne({
    'resetPasswordToken.token': resetPasswordToken,
    'resetPasswordToken.expiresAt': { $gt: Date.now() },
  }).exec();
};

const getUserByVerifyEmailToken = async (verificationToken) => {
  return User.findOne({
    'verificationToken.token': verificationToken,
    'verificationToken.expiresAt': { $gt: Date.now() },
  }).exec();
};

const updateUserById = async (id, data) => {
  const user = await User.findByIdAndUpdate(id, data, { new: true })
    .select('-password -refreshToken -verificationToken -resetPasswordToken')
    .lean();
  return user;
};

const deleteUserById = async (userId) => {
  await User.findByIdAndDelete(userId);
  return true;
};

module.exports = {
  createUser,
  updateUserById,
  getUserById,
  getUserByEmail,
  getUserByRefreshToken,
  getUserByResetPassToken,
  getUserByVerifyEmailToken,
  getUserProfileById,
  deleteUserById,
};
