const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  event: { type: String, enum: ['register_success', 'login_success', 'login_failed', 'logout'], required: true },
  ipAddress: { type: String, maxlength: 80, default: '' },
  userAgent: { type: String, maxlength: 400, default: '' },
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.models.LoginActivity || mongoose.model('LoginActivity', loginActivitySchema);
