import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHendler.js";
import { Auth } from "../models/Auth.model.js";
import { generateAccessToken, generateRefreshToken } from "../utils/JWT.js";
import {generateVerificationText, generateVerificationHtml} from '../utils/userEmailGenerator.js';
import {sendEmail} from "../utils/nodemailer.js";
import crypto from 'crypto';

const generatetoken_and_save = async (userId) => {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);
  try {
    const user = await Auth.findById(userId);
    user.refreshToken = refreshToken;
    await user.save();
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
    name : username,
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

  const verificationUrl = `http://localhost:5173/verify-email/${unHashedToken}`;
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
      // { data: createdUser },
      {},
      // "User created successfully and the varification mail is sent successfully please check your mail box"
      "process is onpending pleas verify your email"
    )
  );
});

const Login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check if the user already exists in the database
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

  // Generate an access token and refresh token
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
    console.error('No refresh token provided');
    throw new ApiError(400, 'Refresh token is required');
  }
  // console.log('Received refresh token: line number 132', requestRefreshToken);

  try {
    // Attempt to find the user by the token
    const user = await Auth.findOne({refreshToken:requestRefreshToken});

    if (!user) {
      console.error('No user found with the provided refresh token');
      throw new ApiError(401, 'Invalid refresh token');
    } else if (user.refreshToken !== requestRefreshToken) {
      console.error('Stored refresh token does not match the provided token');
      throw new ApiError(401, 'Invalid refresh token');
    }
    // console.log('User found, refresh token is valid:', user._id);

    // Generate new tokens
    const { accessToken, refreshToken } = await generatetoken_and_save(user._id);
    // console.log('Generated new tokens:', { accessToken, refreshToken });

    // Update the user's refresh token in the database
    try {
      await Auth.findByIdAndUpdate(user._id, { refreshToken });
      // console.log('Refresh token successfully updated in the database');
    } catch (updateError) {
      // console.error('Failed to save refresh token:', updateError);
      throw new ApiError(409, 'Failed to save refresh token');
    }

    // Respond with new tokens
    return res.status(200).json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        'Tokens refreshed successfully'
      )
    );
  } catch (error) {
    console.error('Error refreshing tokens:', error);
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
    .json(
      new ApiResponse(
        200,
        { isEmailVarified: true },
        "email verified sucessfully"
      )
    );
});








export { Login, refreshAccessAndRefreshToken, Signin, verifyEmail };


