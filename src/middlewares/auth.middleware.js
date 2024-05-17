const { verifyAccessToken } = require('../helpers/jwt.helper');
const { BAD_REQUEST, FORBIDDEN } = require('../utils/errors');
const ac = require('../helpers/accessControl');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || !authHeader?.startsWith('Bearer ')) {
    return res.status(BAD_REQUEST.code).json({ message: BAD_REQUEST.message });
  }

  const parts = authHeader.split(' ');

  if (!parts.length === 2) {
    return res.status(BAD_REQUEST.code).json({ message: BAD_REQUEST.message });
  }
  const token = authHeader.split(' ')[1];


  const decodedToken = verifyAccessToken(token);
  if (!decodedToken) {
    return res.sendStatus(FORBIDDEN.code); // Forbidden
  }


  req.user = decodedToken.user;
  req.user.ac = ac;
  next();
};
