import mongoose from 'mongoose';

const companyListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  country: { type: String, required: true },
  city: { type: String, required: true },
  postcode: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  password: { type: String, required: true }, // Add password field
  comp_code: { type: String, required: true }, // Add employee code field
});

const CompanyList = mongoose.model('CompanyList', companyListSchema);

export default CompanyList;
