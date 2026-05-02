// server/middleware/errorHandler.js
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  // Log error
  logger.error(`${err.name}: ${err.message}`, {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    stack: err.stack
  });
  
  // Determine status code
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  // Handle specific errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    err.message = Object.values(err.errors).map(e => e.message).join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    err.message = 'Invalid resource ID';
  } else if (err.code === 11000) {
    statusCode = 400;
    err.message = 'Duplicate field value entered';
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    err.message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    err.message = 'Token expired';
  }
  
  // Send error response
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;