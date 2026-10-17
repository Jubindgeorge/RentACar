const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  brand: { type: String, required: true, trim: true, maxlength: 80 },
  model: { type: String, required: true, trim: true, maxlength: 80 },
  year: { type: Number, required: true, min: 1950, max: 2100 },
  category: { type: String, default: 'Standard', trim: true },
  transmission: { type: String, enum: ['Automatic', 'Manual'], default: 'Automatic' },
  fuel: { type: String, enum: ['Petrol', 'Diesel', 'Hybrid', 'Electric'], default: 'Petrol' },
  seats: { type: Number, min: 1, max: 20, default: 5 },
  dailyRate: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'AED', uppercase: true, minlength: 3, maxlength: 3 },
  imageUrl: { type: String, default: '' },
  description: { type: String, default: '', maxlength: 2000 },
  pickupLocation: { type: String, default: 'Abu Dhabi' },
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.models.Car || mongoose.model('Car', carSchema);
