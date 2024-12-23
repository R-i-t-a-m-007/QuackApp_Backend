import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  role: { type: String, required: true }, // New field
  department: { type: String, required: true }, // New field
  address: { type: String, required: true },
  joiningDate: { type: Date, required: true }, // New field
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyList', required: true }, // Link to the CompanyList model
  work_code: { type: String, required: true },
  password: { type: String, required: true },
});

const Worker = mongoose.model('Worker', workerSchema);

export default Worker;
