export function success(res, data, statusCode = 200) {
  return res.status(statusCode).json(data);
}

export function error(res, message, statusCode = 400, extra = {}) {
  return res.status(statusCode).json({
    detail: message,
    ...extra
  });
}
