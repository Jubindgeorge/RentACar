module.exports = function requireAdmin(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY;
  if (!configuredKey) {
    return res.status(503).json({ error: 'Admin API is not configured. Set ADMIN_API_KEY in the server environment.' });
  }
  const suppliedKey = req.get('x-admin-key');
  if (!suppliedKey || suppliedKey.length !== configuredKey.length) {
    return res.status(401).json({ error: 'Admin authorization required.' });
  }
  const crypto = require('crypto');
  const valid = crypto.timingSafeEqual(Buffer.from(suppliedKey), Buffer.from(configuredKey));
  if (!valid) return res.status(401).json({ error: 'Invalid admin authorization.' });
  next();
};
