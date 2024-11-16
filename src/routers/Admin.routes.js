import { Router } from "express";
import { 
  createAdmin, 
  loginAdmin, 
  deleteAdmin, 
  rejectAdmin, 
  approveAdmin 
} from '../controllers/Admin.controller.js';
import { verifyAdmin } from "../middlewares/Admin.middleware.js";

const router = Router();

// Create an admin
router.route('/create')
  .post(createAdmin);

// Admin login
router.route('/login')
  .post(loginAdmin);

// Delete an admin (with admin verification)
router.route('/delete/:adminId')
  .delete(verifyAdmin, deleteAdmin);

// Reject an admin
router.route('/reject/:adminId')
  .get(rejectAdmin);

// Approve an admin
router.route('/approve/:adminId')
  .get(approveAdmin);

export default router;
