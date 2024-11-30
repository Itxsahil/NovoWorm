import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHendler.js";
import { Auth } from "../models/Auth.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/JWT.js";
import { generateVerificationText, generateVerificationHtml, generateResetPasswordHtml, generateResetPasswordText } from '../utils/userEmailGenerator.js';
import { sendEmail } from "../utils/nodemailer.js";
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const generatetoken_and_save = async (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  try {
    const user = await Auth.findById(userId);
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while creating the user please try again later"
    )
  }
  return { accessToken, refreshToken };
}

const Signin = asyncHandler(async (req, res) => {
  const { username, password, email } = req.body;

  const userExists = await Auth.findOne({
    $or: [{ username }, { email }],
  });

  if (userExists) {
    throw new ApiError(409, "User already exists");
  }

  const user = await Auth.create({
    name: username,
    password,
    email,
    isEmailVarified: false,
  });

  if (!user) {
    throw new ApiError(
      500,
      "Something went wrong while creating the user please try again later"
    );
  }

  const { unHashedToken, hashedToken, tokenExpiry } =
    user.generateTemporaryToken();

  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = tokenExpiry;
  user.save({ validateBeforeSave: false });

  const verificationUrl = `${req.protocol}://${req.get("host")}/api/v1/auth/verify-email/${unHashedToken}`;
  const subject = `please verify your email ${username}`;
  const html = generateVerificationHtml(username, verificationUrl);
  const text = generateVerificationText(username, verificationUrl);
  await sendEmail(email, subject, html, text);
  const createdUser = await Auth.findById(user._id).select(
    "-password -emailVerificationExpires -emailVerificationToken -isEmailVerified -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(404, "User not found");
  }

  return res.status(201).json(
    new ApiResponse(
      201,
      {},
      "process is onpending pleas verify your email"
    )
  );
});

const Login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  let user = await Auth.findOne({ email });

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "Incorrect password");
  }

  if (!user.isEmailVarified) {
    throw new ApiError(401, "Please verify your email");
  }

  const { accessToken, refreshToken } = await generatetoken_and_save(user._id);
  try {
    await Auth.findByIdAndUpdate(user._id, { refreshToken });
  } catch (error) {
    throw new ApiError(409, "fail to save refresh token")
  }

  return res.status(201).json(
    new ApiResponse(
      200,
      {
        accessToken,
        refreshToken,
        user
      },
      "Login Success"
    )
  );


});

const refreshAccessAndRefreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: requestRefreshToken } = req.body;

  if (!requestRefreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  const auth = jwt.verify(requestRefreshToken, process.env.REFRESH_TOKEN_SECRET);

  try {
    const user = await Auth.findById(auth.userId).select(
      "-password -emailVerificationExpires -emailVerificationToken -isEmailVerified"
    )

    if (!user) {
      console.error('No user found with the provided refresh token');
      throw new ApiError(401, 'Invalid refresh token');
    }

    const { accessToken, refreshToken } = await generatetoken_and_save(user._id);

    try {
      await Auth.findByIdAndUpdate(user._id, { refreshToken });
    } catch (updateError) {
      throw new ApiError(409, 'Failed to save refresh token');
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        'Tokens refreshed successfully'
      )
    );
  } catch (error) {
    throw new ApiError(403, 'Refresh token expired or invalid');
  }
});



const verifyEmail = asyncHandler(async (req, res) => {
  const { unHashedToken } = req.params;
  if (!unHashedToken) {
    throw new ApiError(400, "Please provide the Token");
  }

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");
  console.log(hashedToken);
  const user = await Auth.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  }).select(
    "-password -resetPasswordExpires -resetPasswordToken -refreshToken"
  );

  if (!user) {
    throw new ApiError(404, "User not found...");
  }

  user.isEmailVarified = true;
  user.emailVerificationExpires = undefined;
  user.emailVerificationToken = undefined;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .send(`
      <div>
        <h1 style="font-family: Arial, sans-serif; line-height: 1.6; text-align: center;">email verified successfully</h1>
        <p style="font-family: Arial, sans-serif; line-height: 1.6; text-align: center;">you can login now</p>
      </div>`
    );
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await Auth.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  // console.log(user);

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedResetToken;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

  await user.save({ validateBeforeSave: false });

  const resetLink = `https://novoworm.com/reset-password/${resetToken}`;

  const resetPasswordHtml = generateResetPasswordHtml(
    user.username,
    resetLink
  );


  const resetPasswordText = generateResetPasswordText(user.username, resetLink);

  try {
    await sendEmail(user.email, "Password Reset", resetPasswordText, resetPasswordHtml);
  } catch (error) {
    throw new ApiError(500, "Failed to send email");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Password reset link sent successfully"
    )
  )
});


const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken } = req.params;
  const { newPassword } = req.body;
  // console.log(resetToken, newPassword);
  if (!resetToken || !newPassword) {
    throw new ApiError(400, "Invalid request");
  }

  const hashedResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  const user = await Auth.findOne({
    resetPasswordToken: hashedResetToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save({ validateBeforeSave: false });

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "Password reset successfully"
    )
  );
});






export { Login, refreshAccessAndRefreshToken, Signin, verifyEmail, forgotPassword, resetPassword };


