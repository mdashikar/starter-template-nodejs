const { sendEmail } = require('../helpers/sendEmail.helper');

const sendVerificationEmail = async (user, origin) => {
  const verifyUrl = `${origin}/verify-email?token=${user.verificationToken.token}`;
  const message = `<p>Please click the below link to verify your email address:</p>
                 <p><a href="${verifyUrl}">${verifyUrl}</a></p>`;

  await sendEmail({
    to: user.email,
    subject: 'Starter template nodejs - Verify Email',
    html: `<h4>Verify Email</h4>
             <p>Thanks for registering!</p>
             ${message}`,
  });
};

const sendPasswordResetEmail = async (user, origin) => {
  const resetUrl = `${origin}/reset-password?token=${user.resetPasswordToken.token}`;
  const message = `<p>Please click the below link to reset your password, the link will be valid for 1 day:</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>`;

  await sendEmail({
    to: user.email,
    subject: 'Starter template nodejs - Reset Password',
    html: `<h4>Reset Password Email</h4>
             ${message}`,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
};
