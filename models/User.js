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
    default: null,
  },
  price: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  otp: { type: String },
  otpExpire: { type: Date },
  resetToken: { type: String },
  resetTokenExpire: { type: Date },
  image: { type: String, default: null },
  userCode: { type: String, required: true },
  activities: { type: [{ timestamp: Date, message: String }], default: [] },
});

export default mongoose.model('User', UserSchema);