export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log error for server observability
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR] ${req.method} ${req.originalUrl}:`, err);
  } else {
    console.warn(`[CLIENT ERROR ${statusCode}] ${req.method} ${req.originalUrl}: ${err.message}`);
  }

  const message =
    isProduction && statusCode >= 500
      ? 'Internal Server Error'
      : err.message || 'An unexpected error occurred';

  res.status(statusCode).json({
    detail: message,
    ...(err.details ? { errors: err.details } : {})
  });
}

export default errorHandler;
