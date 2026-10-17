const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const Car = require('../Models/carModel');
const Booking = require('../Models/bookingModel');
const requireAdmin = require('../middleware/requireAdmin');

const router = express.Router();
function hasBookingAccess(booking, req) {
  const supplied = req.get('x-booking-token') || '';
  if (!booking.locationAccessTokenHash || !supplied) return false;
  const actual = crypto.createHash('sha256').update(supplied).digest();
  const expected = Buffer.from(booking.locationAccessTokenHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
const asyncRoute = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/health', (req, res) => {
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    ok: mongoose.connection.readyState === 1,
    database: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown',
    service: 'RentACar API'
  });
});

router.get('/cars', asyncRoute(async (req, res) => {
  const filter = { available: true };
  if (req.query.category) filter.category = String(req.query.category).slice(0, 80);
  const cars = await Car.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ cars });
}));

router.get('/cars/:id', asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid car ID.' });
  const car = await Car.findOne({ _id: req.params.id, available: true }).lean();
  if (!car) return res.status(404).json({ error: 'Car not found or unavailable.' });
  res.json({ car });
}));

router.post('/admin/cars', requireAdmin, asyncRoute(async (req, res) => {
  const allowed = ['name','brand','model','year','category','transmission','fuel','seats','dailyRate','currency','imageUrl','description','pickupLocation','available'];
  const data = {};
  allowed.forEach(key => { if (req.body[key] !== undefined) data[key] = req.body[key]; });
  const car = await Car.create(data);
  res.status(201).json({ message: 'Car created.', car });
}));

router.patch('/admin/cars/:id', requireAdmin, asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid car ID.' });
  const allowed = ['name','brand','model','year','category','transmission','fuel','seats','dailyRate','currency','imageUrl','description','pickupLocation','available'];
  const update = {};
  allowed.forEach(key => { if (req.body[key] !== undefined) update[key] = req.body[key]; });
  const car = await Car.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!car) return res.status(404).json({ error: 'Car not found.' });
  res.json({ message: 'Car updated.', car });
}));

router.delete('/admin/cars/:id', requireAdmin, asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid car ID.' });
  const car = await Car.findByIdAndUpdate(req.params.id, { available: false }, { new: true });
  if (!car) return res.status(404).json({ error: 'Car not found.' });
  res.json({ message: 'Car marked unavailable; booking history is preserved.', car });
}));

router.post('/bookings', asyncRoute(async (req, res) => {
  const { carId, customerName, customerEmail, customerPhone, pickupLocation, dropoffLocation, pickupAt, dropoffAt } = req.body;
  if (![carId, customerName, customerEmail, customerPhone, pickupLocation, dropoffLocation, pickupAt, dropoffAt].every(v => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'Please provide all required booking details.' });
  }
  if (!mongoose.isValidObjectId(carId)) return res.status(400).json({ error: 'Invalid car ID.' });
  const start = new Date(pickupAt), end = new Date(dropoffAt);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || start < new Date()) {
    return res.status(400).json({ error: 'Choose a future pickup time and a later drop-off time.' });
  }
  const car = await Car.findOne({ _id: carId, available: true });
  if (!car) return res.status(404).json({ error: 'Car is not available.' });
  const conflict = await Booking.exists({
    car: car._id, status: { $in: ['pending','confirmed','active'] },
    pickupAt: { $lt: end }, dropoffAt: { $gt: start }
  });
  if (conflict) return res.status(409).json({ error: 'This car is already booked for part of that time.' });
  const days = Math.max(1, Math.ceil((end - start) / 86400000));
  const locationAccessToken = crypto.randomBytes(32).toString('hex');
  const locationAccessTokenHash = crypto.createHash('sha256').update(locationAccessToken).digest('hex');
  const booking = await Booking.create({
    locationAccessTokenHash,
    car: car._id, customerName: customerName.trim(), customerEmail: customerEmail.trim().toLowerCase(),
    customerPhone: customerPhone.trim(), pickupLocation: pickupLocation.trim(), dropoffLocation: dropoffLocation.trim(),
    pickupAt: start, dropoffAt: end, totalPrice: days * car.dailyRate, currency: car.currency
  });
  res.status(201).json({ message: 'Booking request received. Save the location access token securely; it is shown only once.', booking, locationAccessToken });
}));

router.get('/admin/bookings', requireAdmin, asyncRoute(async (req, res) => {
  const bookings = await Booking.find().populate('car').sort({ createdAt: -1 }).lean();
  res.json({ bookings });
}));

router.patch('/admin/bookings/:id/status', requireAdmin, asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid booking ID.' });
  const allowed = ['pending','confirmed','active','completed','cancelled'];
  if (!allowed.includes(req.body.status)) return res.status(400).json({ error: 'Invalid booking status.' });
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  res.json({ message: 'Booking status updated.', booking });
}));

// Location sharing is opt-in per booking. Admins cannot enable it on a customer's behalf.
router.post('/bookings/:id/location-consent', asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid booking ID.' });
  if (req.body.consent !== true && req.body.consent !== false) return res.status(400).json({ error: 'Explicit consent value is required.' });
  const booking = await Booking.findById(req.params.id).select('+locationAccessTokenHash');
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (!hasBookingAccess(booking, req)) return res.status(403).json({ error: 'Valid booking access token required.' });
  booking.locationSharingConsent = req.body.consent;
  booking.locationSharingEnabled = req.body.consent;
  if (!req.body.consent) booking.lastSharedLocation = {};
  await booking.save();
  res.json({ message: req.body.consent ? 'Location sharing enabled by explicit consent.' : 'Location sharing stopped.', locationSharingEnabled: booking.locationSharingEnabled });
}));

router.post('/bookings/:id/location', asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: 'Invalid booking ID.' });
  const { latitude, longitude } = req.body;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Valid numeric latitude and longitude are required.' });
  }
  const booking = await Booking.findById(req.params.id).select('+locationAccessTokenHash');
  if (!booking) return res.status(404).json({ error: 'Booking not found.' });
  if (!hasBookingAccess(booking, req)) return res.status(403).json({ error: 'Valid booking access token required.' });
  if (!booking.locationSharingConsent || !booking.locationSharingEnabled) return res.status(403).json({ error: 'Location sharing is not enabled for this booking.' });
  booking.lastSharedLocation = { latitude, longitude, updatedAt: new Date() };
  await booking.save();
  res.json({ message: 'Location updated while sharing is enabled.' });
}));

router.get('/admin/location-sharing', requireAdmin, asyncRoute(async (req, res) => {
  const bookings = await Booking.find({ locationSharingConsent: true, locationSharingEnabled: true, 'lastSharedLocation.updatedAt': { $exists: true } })
    .select('customerName customerEmail car lastSharedLocation').populate('car', 'name brand model').lean();
  res.json({ locations: bookings });
}));

module.exports = router;
