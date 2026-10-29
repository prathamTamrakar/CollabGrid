export function notFoundHandler(req, res) {
  res.status(404).json({ detail: `Route ${req.method} ${req.originalUrl} not found` });
}

export default notFoundHandler;
