module.exports = function requireAdmin(req, res, next) {
  const configuredKey = process.env.ADMIN_API_KEY;
  if (!configuredKey) {
    return res.status(503).json({ error: 'Admin API is not configured. Set ADMIN_API_KEY in the server environment.' });
  }
  const suppliedKey = req.get('x-admin-key');
  if (!suppliedKey) return res.status(401).json({ error: 'Admin authorization required.' });
  const crypto = require('crypto');
  const supplied = Buffer.from(suppliedKey);
  const expected = Buffer.from(configuredKey);
  if (supplied.length !== expected.length) return res.status(401).json({ error: 'Invalid admin authorization.' });
  const valid = crypto.timingSafeEqual(supplied, expected);
  if (!valid) return res.status(401).json({ error: 'Invalid admin authorization.' });
  next();
};
