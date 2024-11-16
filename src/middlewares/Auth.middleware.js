import { asyncHandler } from "../utils/asyncHendler.js";
import { ApiError } from "../utils/ApiError.js";
import { Auth } from "../models/Auth.model.js";
import jwt from "jsonwebtoken";

const verifyAuth = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      throw new ApiError(401, "Access Denied. No token provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // console.log(decodedToken);
    const auth = await Auth.findById(decodedToken.userId).select(
      "-password -refreshToken"
    );

    if (!auth) {
      throw new ApiError(401, "Access Denied. Invalid token");
    }
    console.log(auth);

    req.auth = auth;
    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid Access Token"
    );
  }
});

export { verifyAuth };
