import { httpRequest } from '../utils.js';

export const authService = {
  /**
   * Initiate OAuth flow - Step 1: Login with credentials
   */
  async initiateAuth(email, password, recaptchaToken) {
    return await httpRequest({
      url: '/user-api/oauth/auth',
      method: 'POST',
      body: {
        email,
        password,
        client_type: 'web',
        redirect_uri: 'https://spotme.jafetguzman.me/login/verificacion',
        'g-recaptcha-response': recaptchaToken
      }
    });
  },

  /**
   * Complete OAuth flow - Step 2: Verify 2FA code and get access token
   */
  async verifyCode(userId, code) {
    return await httpRequest({
      url: '/user-api/oauth/token',
      method: 'POST',
      body: {
        user_id: parseInt(userId),
        code: code.toString(),
        client_type: 'web'
      }
    });
  },

  /**
   * Complete user registration by setting their first password
   */
  async completeRegistration(newPassword, confirmPassword, recaptchaToken) {
    return await httpRequest({
      url: '/user-api/complete/user/register',
      method: 'PATCH',
      useToken: true,
      body: {
        new_password: newPassword,
        confirm_password: confirmPassword,
        'g-recaptcha-response': recaptchaToken
      }
    });
  },

  /**
   * Logout user from the system
   */
  async logout() {
    return await httpRequest({
      url: '/user-api/oauth/logout',
      method: 'POST',
      useToken: true
    });
  },

  /**
   * Change user password (requires current password and JWT token)
   */
  async changePassword(currentPassword, newPassword, confirmPassword, recaptchaToken) {
    return await httpRequest({
      url: '/user-api/user/change-password',
      method: 'PATCH',
      useToken: true,
      body: {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
        'g-recaptcha-response': recaptchaToken
      }
    });
  },

  /**
   * Request password reset code (Step 1) - Public endpoint
   */
  async requestPasswordResetCode(email, recaptchaToken) {
    return await httpRequest({
      url: '/user-api/auth/reset-password',
      method: 'POST',
      body: {
        email: email,
        'g-recaptcha-response': recaptchaToken
      }
    });
  },

  /**
   * Reset password with code (Step 2) - Public endpoint
   */
  async resetPasswordWithCode(email, resetCode, newPassword, confirmPassword, recaptchaToken) {
    return await httpRequest({
      url: '/user-api/auth/reset-password',
      method: 'POST',
      body: {
        email: email,
        reset_code: resetCode,
        new_password: newPassword,
        confirm_password: confirmPassword,
        'g-recaptcha-response': recaptchaToken
      }
    });
  },

  /**
   * @deprecated - Use requestPasswordResetCode instead
   */
  async requestPasswordReset(email) {
    return this.requestPasswordResetCode(email);
  },

  /**
   * @deprecated - Use resetPasswordWithCode instead
   */
  async resetPassword(email, code, newPassword, confirmPassword) {
    return this.resetPasswordWithCode(email, code, newPassword, confirmPassword);
  }
};
