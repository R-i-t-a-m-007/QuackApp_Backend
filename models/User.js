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
    default: null, // Allow null as a default value
  },
  createdAt: { type: Date, default: Date.now },
  otp: { type: String }, // Add OTP field
  otpExpire: { type: Date }, // Add OTP expiration field
  image: { type: String, default: null }, // Field to store the user's profile image
});

export default mongoose.model('User ', UserSchema);