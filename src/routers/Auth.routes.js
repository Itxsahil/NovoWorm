import { Router } from 'express';
import { Login, refreshAccessAndRefreshToken, Signin, verifyEmail, forgotPassword, resetPassword } from '../controllers/Auth.controller.js';

const router = Router();

router.route('/register') 
  .post(Signin);

router.route('/login')
  .post(Login);

router.route('/refresh')
  .post(refreshAccessAndRefreshToken);

router.route("/verify-email/:unHashedToken").get(verifyEmail);

router.route("/forgot-password").post(forgotPassword);

router.route("/reset-password/:resetToken").post(resetPassword);

export default router;
