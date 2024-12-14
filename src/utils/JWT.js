import jwt from 'jsonwebtoken';

const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: '29d', // Access token expires in 1 days
  });
};

const generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: '7d', // Refresh token expires in 7 days
  });
};

export { generateAccessToken, generateRefreshToken };
