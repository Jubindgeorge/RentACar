const mongoose = require("mongoose");

/**
 * Keep database credentials out of source control.
 * Configure MONGODB_URI in your Codespaces environment/secrets.
 */
const url = process.env.MONGODB_URI;

const connectDB = async () => {
  if (!url) {
    throw new Error(
      "MONGODB_URI is not configured. Add it to the Codespaces environment before starting the app."
    );
  }

  try {
    await mongoose.connect(url, {
      serverSelectionTimeoutMS: 10000,
    });
    console.log("MongoDB connected successfully.");
  } catch (error) {
    console.error(
      "MongoDB connection failed. Check that MONGODB_URI is correct, the Atlas cluster hostname exists, and your current IP is allowed in Atlas Network Access."
    );
    throw error;
  }
};

module.exports = connectDB;
