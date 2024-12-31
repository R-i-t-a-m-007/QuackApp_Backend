import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  postcode: { type: String, required: true },
  password: { type: String, required: true },
  package: { 
    type: String, 
    enum: ['Basic', 'Pro'], 
    default: '', // Set default to empty string
  }, // Track the package selected by the user
  createdAt: { type: Date, default: Date.now },
  otp: { type: String }, // Add OTP field
  otpExpire: { type: Date } // Add OTP expiration field
});

export default mongoose.model('User ', UserSchema);