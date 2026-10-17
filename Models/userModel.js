const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullname: { type: String, required: [true, 'Full name is required'], trim: true, maxlength: 120 },
  email: { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, trim: true, maxlength: 254 },
  password: { type: String, required: [true, 'Password is required'], select: false, minlength: 8 }
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.verifyPassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
