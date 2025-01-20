// models/Job.js
import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  location: { type: String, required: true },
  date: { type: Date, required: true },
  shift: { type: String, required: true },
  workersRequired: { type: Number, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyList', required: true }, // Reference to the CompanyList model
  createdAt: { type: Date, default: Date.now },
});

const Job = mongoose.model('Job', jobSchema);
export default Job;