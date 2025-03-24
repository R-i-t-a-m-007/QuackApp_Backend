import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  address: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  password: { type: String, required: true },
  availability: [{
    date: { type: Date, required: true },
    shift: { type: String, enum: ['Morning', 'Afternoon', 'Evening'], required: true }
  }],
  image: { type: String, default: null },
  userCode: { type: String, required: true },
  approved: { type: Boolean, default: false },
  invitedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  activities: { type: [{ timestamp: Date, message: String }], default: [] },
  resetToken: { type: String }, // New field for password reset token
  resetTokenExpire: { type: Date }, // New field for token expiration
  messages: [
    {
      message: { type: String, required: true },
      senderId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Sender (either a User or Company)
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

const Worker = mongoose.model('Worker', workerSchema);
export default Worker;