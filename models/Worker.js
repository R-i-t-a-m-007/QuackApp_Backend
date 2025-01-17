import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  address: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyList' }, // Reference to the company
  comp_code: { type: String, required: true }, // Company code
  password: { type: String, required: true },
  package: { type: String, enum: ['Basic', 'Pro'] }, // Store the user's package type
  availability: [{
    date: { type: Date, required: true },
    shift: { type: String, enum: ['Morning', 'Afternoon', 'Evening'], required: true }
  }],
  image: { type: String, default: null }, // Field to store the image as a base64 string
});

export default mongoose.model('Worker', workerSchema);