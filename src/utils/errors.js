const constants = require('./constants');

module.exports = {
  INTERNAL_SERVER_ERROR: {
    message: constants.HTTP_CODE_500_MESSAGE,
    code: constants.HTTP_CODE_500_CODE,
  },
  BAD_REQUEST: {
    message: constants.HTTP_CODE_400_MESSAGE,
    code: constants.HTTP_CODE_400_CODE,
  },
  UNAUTHORIZED: {
    message: constants.HTTP_CODE_401_MESSAGE,
    code: constants.HTTP_CODE_401_CODE,
  },
  FORBIDDEN: {
    message: constants.HTTP_CODE_403_MESSAGE,
    code: constants.HTTP_CODE_403_CODE,
  },
  NOT_FOUND: {
    message: constants.HTTP_CODE_404_MESSAGE,
    code: constants.HTTP_CODE_404_CODE,
  },
  NOT_ACCEPTABLE: {
    message: constants.HTTP_CODE_406_MESSAGE,
    code: constants.HTTP_CODE_406_CODE,
  },
  UNPROCESSABLE_ENTITY: {
    message: constants.HTTP_CODE_422_MESSAGE,
    code: constants.HTTP_CODE_422_CODE,
  },
  TOO_MANY_REQUESTS: {
    message: constants.HTTP_CODE_429_MESSAGE,
    code: constants.HTTP_CODE_429_CODE,
  },
  ID_NOT_VALID: {
    message: constants.ID_NOT_VALID_MESSAGE,
    code: constants.HTTP_CODE_400_CODE,
  },
};
