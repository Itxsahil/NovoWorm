/**
 * Generate HTML content for email verification
 * @param {string} username - Username of the recipient
 * @param {string} verificationUrl - Verification URL
 * @returns {string} - HTML content
 */
export const generateVerificationHtml = (username, verificationUrl) => {
  return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Hello, ${username}!</h2>
            <p>Thank you for registering. Please verify your email address by clicking the link below:</p>
            <p><a href="${verificationUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block;">Verify Email</a></p>
            <p>If you did not request this, please ignore this email.</p>
        </div>
    `;
};

/**
 * Generate plain text content for email verification
 * @param {string} username - Username of the recipient
 * @param {string} verificationUrl - Verification URL
 * @returns {string} - Plain text content
 */
export const generateVerificationText = (username, verificationUrl) => {
  return `
        Hello, ${username}!
    
        Thank you for registering. Please verify your email address by clicking the link below:
        ${verificationUrl}
    
        If you did not request this, please ignore this email.
    `;
};

/**
 * Generate HTML content for password reset
 * @param {string} username - Username of the recipient
 * @param {string} resetUrl - Password reset URL
 * @returns {string} - HTML content
 */
export const generateResetPasswordHtml = (username, resetUrl) => {
  return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hello, ${username}!</h2>
        <p>You requested to reset your password. Please click the link below to reset it:</p>
        <p><a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block;">Reset Password</a></p>
        <p>If you did not request this, please ignore this email.</p>
      </div>
    `;
};

/**
 * Generate plain text content for password reset
 * @param {string} username - Username of the recipient
 * @param {string} resetUrl - Password reset URL
 * @returns {string} - Plain text content
 */
export const generateResetPasswordText = (username, resetUrl) => {
  return `
      Hello, ${username}!
    
      You requested to reset your password. Please click the link below to reset it:
      ${resetUrl}
    
      If you did not request this, please ignore this email.
    `;
};
