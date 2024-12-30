import mongoose from 'mongoose';

const workerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  role: { type: String, required: true },
  department: { type: String, required: true },
  address: { type: String, required: true },
  joiningDate: { type: Date, required: true },
  company: { type: mongoose.Schema.Types.ObjectId, ref: 'CompanyList', required: true },
  work_code: { type: String, required: true },
  password: { type: String, required: true },
  availability: [{
    date: { type: Date, required: true },
    shift: { type: String, enum: ['Morning', 'Afternoon', 'Evening'], required: true } // Store a single shift
  }],
});

const Worker = mongoose.model('Worker', workerSchema);

export default Worker;