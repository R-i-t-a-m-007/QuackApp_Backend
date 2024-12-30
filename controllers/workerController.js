import Worker from '../models/Worker.js';
import CompanyList from '../models/CompanyList.js';
import nodemailer from 'nodemailer';
import  bcrypt from 'bcryptjs';

const generateEmpCode = () => `EMP${Math.floor(1000 + Math.random() * 9000)}`;

// Function to send email to the worker
const sendWorkerEmail = async (email, name, role, workCode, password) => {
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
    subject: 'Welcome to the Company',
    text: `Hello ${name},

Welcome to the company! Your role is: ${role}.
Your credentials are:

Email: ${email}
Employee Code: ${workCode}
Password: ${password}
Please keep these credentials safe.

We are excited to have you on board.

Best regards,
The QuackApp Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to worker:', email);
  } catch (error) {
    console.error('Error sending email to worker:', error);
  }
};

// Add a new worker
export const addWorker = async (req, res) => {
  const { name, email, phone, role, department, address, joiningDate, password } = req.body;

  try {
    // Ensure a company is logged in
    if (!req.session.company || !req.session.company._id) {
      return res.status(401).json({ message: 'No company logged in.' });
    }

    const companyId = req.session.company._id;

    // Check if the worker already exists for the logged-in company
    const existingWorker = await Worker.findOne({ email, company: companyId });
    if (existingWorker) {
      return res.status(400).json({ message: 'Worker already exists in this company.' });
    }

    // Check if the email already exists in the Worker model
    const existingEmail = await Worker.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const workCode = generateEmpCode();
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and save the new worker
    const newWorker = new Worker({
      name,
      email,
      phone,
      role,
      department,
      address,
      joiningDate,
      company: companyId,
      work_code: workCode,
      password: hashedPassword,
    });

    await newWorker.save();

    // Send email to the worker
    await sendWorkerEmail(email, name, role, workCode, password);

    res.status(201).json({ message: 'Worker added successfully!', worker: newWorker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Fetch all workers for the logged-in company
export const getWorkers = async (req, res) => {
  try {
    // Ensure a company is logged in
    if (!req.session.company || !req.session.company._id) {
      return res.status(401).json({ message: 'No company logged in.' });
    }

    const companyId = req.session.company._id;

    // Fetch all workers linked to the logged-in company
    const workers = await Worker.find({ company: companyId });

    res.status(200).json(workers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetch workers.' });
  }
};

// Update a worker's details
export const updateWorker = async (req, res) => {
  const { workerId } = req.params;
  const { name, email, phone, role, department, address, joiningDate } = req.body;

  try {
    // Ensure a company is logged in
    if (!req.session.company || !req.session.company._id) {
      return res.status(401).json({ message: 'No company logged in.' });
    }

    const companyId = req.session.company._id;

    // Update the worker linked to the logged-in company
    const updatedWorker = await Worker.findOneAndUpdate(
      { _id: workerId, company: companyId },
      { name, email, phone, role, department, address, joiningDate },
      { new: true }
    );

    if (!updatedWorker) {
      return res.status(404).json({ message: 'Worker not found or you do not have permission to update it.' });
    }

    res.status(200).json({ message: 'Worker updated successfully.', worker: updatedWorker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Delete a worker
// Delete a worker
export const deleteWorker = async (req, res) => {
  
  const { workerId } = req.params; // Corrected line

  try {
    // Ensure a company is logged in
    if (!req.session.company || !req.session.company._id) {
      return res.status(401).json({ message: 'No company logged in.' });
    }

    const companyId = req.session.company._id;

    // Delete the worker linked to the logged-in company
    const worker = await Worker.findOneAndDelete({ _id: workerId, company: companyId });

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found or you do not have permission to delete it.' });
    }

    res.status(200).json({ message: 'Worker deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};


// Fetch a single worker by ID
export const getWorkerById = async (req, res) => {
  const { workerId } = req.params;

  try {
    // Ensure a company is logged in
    if (!req.session.company || !req.session.company._id) {
      return res.status(401).json({ message: 'No company logged in.' });
    }

    const companyId = req.session.company._id;

    // Fetch the worker linked to the logged-in company
    const worker = await Worker.findOne({ _id: workerId, company: companyId });

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found or you do not have permission to view it.' });
    }

    res.status(200).json(worker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Function to log in a worker
export const loginWorker = async (req, res) => {
  const { workerCode, password } = req.body;

  try {
    const worker = await Worker.findOne({ work_code: workerCode });

    if (!worker || !(await bcrypt.compare(password, worker.password))) {
      return res.status(401).json({ message: 'Invalid work code or password.' });
    }

    // Create a session for the logged-in worker
    req.session.worker = { _id: worker._id, work_code: worker.work_code };

    console.log('Worker logged in:', req.session.worker); // Debugging log

    res.status(200).json({ message: 'Login successful.', worker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};
// Update worker's availability
export const updateWorkerAvailability = async (req, res) => {
  const { workerId } = req.params;
  const { date, shifts } = req.body; // Expecting date and shifts from the request body

  try {
    // Ensure a worker is logged in
    if (!req.session.worker || req.session.worker._id !== workerId) {
      return res.status(401).json({ message: 'Unauthorized access.' });
    }

    // Update worker's availability
    const updatedWorker = await Worker.findOneAndUpdate(
      { _id: workerId },
      { $push: { availability: { date, shifts } } }, // Push new availability
      { new: true }
    );

    if (!updatedWorker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.status(200).json({ message: 'Worker availability updated successfully.', worker: updatedWorker });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};


export const logoutWorker = async (req, res) => {
  try {
    // Ensure a worker is logged in
    if (!req.session.worker) {
      return res.status(401).json({ message: 'No worker logged in.' });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Error during logout:', err);
        return res.status(500).json({ message: 'Logout failed.' });
      }

      res.clearCookie('connect.sid'); // Clear session cookie
      res.status(200).json({ message: 'Logged out successfully.' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const getLoggedInWorker = async (req, res) => {
  try {
    // Ensure a worker is logged in
    if (!req.session.worker || !req.session.worker._id) {
      return res.status(401).json({ message: 'No worker logged in.' });
    }

    const workerId = req.session.worker._id;

    // Fetch all information for the logged-in worker
    const worker = await Worker.findById(workerId);

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.status(200).json(worker);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};


