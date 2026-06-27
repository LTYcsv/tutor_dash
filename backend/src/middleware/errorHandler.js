function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.code === 'P2025' ? 404 : err.status || 500;
  res.status(status).json({ error: err.message || 'Internal server error' });
}

module.exports = { errorHandler };
