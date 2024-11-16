import { Router } from 'express';
import { Login, refreshAccessAndRefreshToken, Signin, verifyEmail } from '../controllers/Auth.controller.js';

const router = Router();

router.route('/register') 
  .post(Signin);

router.route('/login')
  .post(Login);

router.route('/refresh')
  .post(refreshAccessAndRefreshToken);

  router.route("/verify-email/:unHashedToken").get(verifyEmail);

export default router;
