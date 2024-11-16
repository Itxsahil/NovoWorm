import { asyncHandler } from "../utils/asyncHendler.js";
import { ApiError } from "../utils/ApiError.js";
import { Admin } from "../models/Admin.model.js";
import jwt from "jsonwebtoken";

const verifyAdmin = asyncHandler(async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.headers.authorization?.replace("Bearer ", "");
    
    if (!token) {
      throw new ApiError(401, "Access Denied. No token provided");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    console.log(decodedToken);
    const admin = await Admin.findById(decodedToken.userId).select(
      "-password -refreshToken"
    );

    if (!admin) {
      throw new ApiError(401, "Access Denied. Invalid token");
    }

    req.admin = admin;
    next();
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Invalid Access Token"
    );
  }
});

export { verifyAdmin };
