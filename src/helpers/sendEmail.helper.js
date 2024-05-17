const nodemailer = require('nodemailer');
const { smtpOptions } = require('../config/config');
const logger = require('../utils/logger');

const sendEmail = async ({ to, subject, html, from = smtpOptions.mailForm }) => {
  try {
    const transporter = nodemailer.createTransport(smtpOptions);
    await transporter.sendMail({ from, to, subject, html });
  } catch (error) {
    logger.error(error);
    throw new Error(error);
  }
};

module.exports = { sendEmail };
