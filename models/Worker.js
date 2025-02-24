// models/Worker.js
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
  image: { type: String, default: null }, // Field to store the image as a base64 string
  userCode: { type: String, required: true }, // New field for user code
  approved: { type: Boolean, default: false }, // Field to track approval status
  invitedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }] // Track invited jobs
});

const Worker = mongoose.model('Worker', workerSchema);
export default Worker;