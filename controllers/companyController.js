import CompanyList from '../models/CompanyList.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Helper to generate a random employee code
const generateEmpCode = () => `COMP${Math.floor(1000 + Math.random() * 9000)}`;

// Function to send email using Nodemailer
const sendEmail = async (email, compCode, password) => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Successful Registration',
    text: `Your company has been successfully registered. Your credentials are:

Email: ${email}
Company Code: ${compCode}
Password: ${password}

Please keep these credentials safe.

Best regards,
The QuackApp Team`,
              };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Function to handle company login
export const companyLogin = async (req, res) => {
  const { compcode, password } = req.body;

  try {
    // Check if the company exists with the given compcode
    const company = await CompanyList.findOne({ comp_code: compcode });
    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    // Compare the entered password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, company.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    // Create a session or token for the logged-in user
    req.session.company = company; // Assuming you want to store the company in the session
    res.status(200).json({ message: 'Login successful', company });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};


export const addCompany = async (req, res) => {
  const { name, email, phone, address, country, city, postcode, password } = req.body;
  const userId = req.session.user.id; // Get the user ID from the session

  try {
    // Check if the company already exists by email
    const existingCompanyByEmail = await CompanyList.findOne({ email });
    if (existingCompanyByEmail) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Check if the username already exists (assuming you have a username field)
    const existingCompanyByUsername = await CompanyList.findOne({ username: req.body.username });
    if (existingCompanyByUsername) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    // Generate a unique employee code
    const compCode = generateEmpCode();

    // Hash the password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new company
    const newCompany = new CompanyList({
      name,
      email,
      phone,
      address,
      country,
      city,
      postcode,
      user: userId,
      password: hashedPassword, // Store the hashed password
      comp_code: compCode, // Store the generated employee code
    });

    // Save the company in the database
    await newCompany.save();

    // Send email with registration info (plain text password for user reference)
    await sendEmail(email, compCode, password);

    res.status(201).json({ message: 'Company added successfully!', company: newCompany });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Fetch the list of companies associated with the logged-in user
export const getCompanies = async (req, res) => {
  const userId = req.session.user.id; // Get the user ID from the session

  try {
    const companies = await CompanyList.find({ user: userId });
    res.status(200).json(companies);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch companies.' });
  }
};

// Update company details
export const updateCompany = async (req, res) => {
  const { companyId } = req.params;
  const { name, email, phone, address, city, postcode } = req.body;
  const userId = req.session.user.id; // Get the user ID from the session

  try {
    const updatedCompany = await CompanyList.findOneAndUpdate(
      { _id: companyId, user: userId },
      { name, email, phone, address, city, postcode },
      { new: true }
    );

    if (!updatedCompany) {
      return res.status(404).json({ message: 'Company not found or you do not have permission to update it.' });
    }

    res.status(200).json(updatedCompany);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete a company
export const deleteCompany = async (req, res) => {
  const companyId = req.params.id;
  const userId = req.session.user.id; // Get the user ID from the session

  try {
    const company = await CompanyList.findOneAndDelete({ _id: companyId, user: userId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found or you do not have permission to delete it.' });
    }

    res.status(200).json({ message: 'Company deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out' });
    }

    // Send a response indicating the user has been logged out successfully
    res.status(200).json({ message: 'Logged out successfully' });
  });
};

export const getLoggedInCompany = async (req, res) => {
  try {
    // Check if the session contains a logged-in company
    if (!req.session.company || !req.session.company._id) {
      return res.status(401).json({ message: 'No company logged in.' });
    }

    // Fetch the company details from the database, excluding the password
    const company = await CompanyList.findById(req.session.company._id).select('-password');

    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }

    res.status(200).json({ company });
  } catch (error) {
    console.error('Error fetching logged-in company:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};