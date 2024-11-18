import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHendler.js";
import { Admin } from "../models/Admin.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/JWT.js";
import generateSuperAdminEmail from "../utils/emailGenerator.js";
import {sendEmail} from '../utils/nodemailer.js';

const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// const isValidPassword = (password) => {
//   const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
//   return passwordRegex.test(password);
// };

const createAdmin = asyncHandler(async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new ApiError(400, 'All fields are required');
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, 'Invalid email address');
  }

  // if (!isValidPassword(password)) {
  //   throw new ApiError(400, 'Choose a strong password');
  // }

  // Check if the admin already exists
  const existingAdmin = await Admin.findOne({ $or: [{ username }, { email }] });
  if (existingAdmin) {
    throw new ApiError(400, 'Admin with this username or email already exists');
  }

  // Create the admin (but not yet active)
  const admin = await Admin.create({ username, email, password, isActive: false });

  // Generate and send the email to the super admin
  // const { text, html } = generateSuperAdminEmail(admin._id, admin.username, admin.email);
  // await sendEmail(process.env.EMAIL, 'Admin Approval Request', text, html);

  res.status(201).json(new ApiResponse(
    200,
    {},
    'Admin created. Approval request sent to super admin.'
  ));
});



const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ email });
  if (!admin || !(await admin.checkPassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate tokens
  const accessToken = generateAccessToken(admin._id);
  const refreshToken = generateRefreshToken(admin._id);

  res.status(200).json(new ApiResponse('Login successful', { accessToken, refreshToken }));
});

const deleteAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params; // Assume you pass the admin ID in the request params

  // Find and delete the admin
  const admin = await Admin.findByIdAndDelete(adminId);
  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  res.status(200).json(new ApiResponse('Admin deleted successfully'));
});

// Approve Admin
const approveAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  const admin = await Admin.findByIdAndUpdate(adminId, { isActive: true }, { new: true });
  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  res.status(200).json(new ApiResponse('Admin approved successfully', admin));
});

// Reject Admin
const rejectAdmin = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  const admin = await Admin.findByIdAndDelete(adminId);
  if (!admin) {
    throw new ApiError(404, 'Admin not found');
  }

  res.status(200).json(new ApiResponse('Admin rejected and removed successfully'));
});




export { createAdmin, loginAdmin, deleteAdmin, approveAdmin, rejectAdmin };
