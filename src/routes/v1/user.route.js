const { Router } = require('express');

const router = Router();

const { userProfileHandler, updateUserProfileHandler, deleteUserHandler } = require('../../modules/users/user.controller');

router.get('/profile', userProfileHandler);

router.put('/profile', updateUserProfileHandler);

router.delete('/profile', deleteUserHandler);

module.exports = router;
