import mongoose from 'mongoose';

const companyListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  postcode: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user who added this company
  password: { type: String, required: true }, // Add password field
  comp_code: { type: String, required: true }, // Add company code field
});

export default mongoose.model('CompanyList', companyListSchema);
