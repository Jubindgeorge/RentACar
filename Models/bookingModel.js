const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  car: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  customerName: { type: String, required: true, trim: true, maxlength: 120 },
  customerEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
  customerPhone: { type: String, required: true, trim: true, maxlength: 40 },
  pickupLocation: { type: String, required: true, trim: true, maxlength: 200 },
  dropoffLocation: { type: String, required: true, trim: true, maxlength: 200 },
  pickupAt: { type: Date, required: true },
  dropoffAt: { type: Date, required: true },
  totalPrice: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'AED', uppercase: true },
  status: { type: String, enum: ['pending', 'confirmed', 'active', 'completed', 'cancelled'], default: 'pending' },
  locationAccessTokenHash: { type: String, select: false },
  locationSharingConsent: { type: Boolean, default: false },
  locationSharingEnabled: { type: Boolean, default: false },
  lastSharedLocation: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    updatedAt: Date
  }
}, { timestamps: true });

bookingSchema.index({ car: 1, pickupAt: 1, dropoffAt: 1, status: 1 });
module.exports = mongoose.models.Booking || mongoose.model('Booking', bookingSchema);
