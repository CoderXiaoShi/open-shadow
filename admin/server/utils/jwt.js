const jwt = require('jsonwebtoken');

const secret = 'your_secret_key';
const expiresIn = '24h';

const generateToken = (payload) => {
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken
};