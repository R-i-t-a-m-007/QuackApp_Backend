import Worker from '../models/Worker.js';
import Job from '../models/Job.js'; // Import the Job model
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import CompanyList from '../models/CompanyList.js'; // Import the CompanyList model

// Function to send email to the worker with credentials
const sendWorkerEmail = async (email, name, role, userCode, password) => {
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

User  Code: ${userCode}
Password: ${password}

Please keep these credentials safe. 

Please wait for your approval, and we will let you know once your account is active.

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

const sendApprovalEmail = async (email, name) => {
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
    subject: 'Your Worker Registration has been Approved',
    text: `Hello ${name},

Congratulations! Your registration has been approved! You can now log in using your credentials.

Please follow the previous registration email for your User Code and Password.

Best regards,
The QuackApp Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Approval email sent to worker:', email);
  } catch (error) {
    console.error('Error sending approval email to worker:', error);
  }
};

// Add a new worker
export const addWorker = async (req, res) => {
  const { name, email, phone, role, department, address, joiningDate, password, userCode } = req.body;

  try {
    // Check if the worker already exists
    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res.status(400).json({ message: 'Worker already exists with this email.' });
    }

    // Log the password before hashing
    console.log('Password before hashing:', password);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Hashed Password:', hashedPassword); // Log the hashed password

    // Check if the user or company is adding the worker
    const userId = req.session.user ? req.session.user.id : null;
    const companyId = req.session.company ? req.session.company._id : null;

    // If a user is logged in, link the worker to the user
    if (userId) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User  not found.' });
      }
      // Check if the user code matches the user's code
      if (user.userCode !== userCode) {
        return res.status(403).json({ message: 'User  code does not match.' });
      }
    }

    // If a company is logged in, link the worker to the company
    if (companyId) {
      const company = await CompanyList.findById(companyId);
      if (!company) {
        return res.status(404).json({ message: 'Company not found.' });
      }
      // Check if the user code matches the company's code
      if (company.comp_code !== userCode) {
        return res.status(403).json({ message: 'Company code does not match.' });
      }
    }

    // Create and save the new worker in a pending state
    const newWorker = new Worker({
      name,
      email,
      phone,
      role,
      department,
      address,
      joiningDate,
      password: hashedPassword,
      userCode, // Include userCode
      approved: false, // Initially set to false
      invitedJobs: [], // Initialize invitedJobs array
    });

    await newWorker.save();

    // Send registration acknowledgment email to the worker with credentials
    await sendWorkerEmail(email, name, role, userCode, password);

    res.status(201).json({ message: 'Worker registration successful. Awaiting approval.' });
  } catch (error) {
    console.error('Error adding worker:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Invite a worker to a job
export const inviteWorkerToJob = async (req, res) => {
  const { workerId } = req.params; // Get the worker ID from the request parameters
  const { jobId } = req.body; // Get the job ID from the request body

  try {
    const worker = await Worker.findById(workerId);
    const job = await Job.findById(jobId);

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Add the job ID to the worker's invitedJobs array
    worker.invitedJobs.push(jobId);
    await worker.save();

    // Add the worker ID to the job's invitedWorkers array
    job.invitedWorkers.push(workerId);
    await job.save();

    res.status(200).json({ message: 'Worker invited successfully!', worker });
  } catch (error) {
    console.error('Error inviting worker:', error);
    res.status(500).json({ message: 'Server error while inviting worker.' });
  }
};

// Fetch jobs that a worker has been invited to
export const getInvitedJobsForWorker = async (req, res) => {
  const workerId = req.session.worker ? req.session.worker._id : null; // Get the logged-in worker ID from the session

  if (!workerId) {
    return res.status(403).json({ message: 'Unauthorized. Worker ID is required.' });
  }

  try {
    const worker = await Worker.findById(workerId).populate('invitedJobs'); // Populate the invitedJobs field
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.status(200).json(worker.invitedJobs); // Return the jobs the worker has been invited to
  } catch (error) {
    console.error('Error fetching invited jobs:', error);
    res.status(500).json({ message: 'Server error while fetching invited jobs.' });
  }
};

// Accept or decline a job invitation
export const respondToJobInvitation = async (req, res) => {
  const { jobId, response } = req.body; // response can be 'accept' or 'decline'
  const workerId = req.session.worker ? req.session.worker._id : null; // Get the logged-in worker ID from the session

  try {
    const worker = await Worker.findById(workerId);
    const job = await Job.findById(jobId);

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    if (response === 'accept') {
      // Add worker to the job's workers array
      job.workers.push(workerId);
      // Remove worker from invitedWorkers
      job.invitedWorkers = job.invitedWorkers.filter(id => id.toString() !== workerId.toString());
      // Check if the job is now filled
      if (job.workers.length >= job.workersRequired) {
        job.jobStatus = true; // Mark job as filled
      }
    } else if (response === 'decline') {
      // Remove worker from invitedJobs
      worker.invitedJobs = worker.invitedJobs.filter(id => id.toString() !== jobId.toString());
    }

    await job.save();
    await worker.save();

    res.status(200).json({ message: `Job invitation ${response}ed successfully!`, job });
  } catch (error) {
    console.error('Error responding to job invitation:', error);
    res.status(500).json({ message: 'Server error while responding to job invitation.' });
  }
};

// Approve Worker
export const approveWorker = async (req, res) => {
  const { workerId } = req.params;

  try {
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    worker.approved = true; // Set approved to true
    await worker.save();

    // Send an email to the worker notifying them of approval without credentials
    await sendApprovalEmail(worker.email, worker.name);

    res.status(200).json({ message: 'Worker approved successfully.' });
  } catch (error) {
    console.error('Error approving worker:', error);
    res.status(500).json({ message: 'Server error while approving worker.' });
  }
};

// Decline Worker
export const declineWorker = async (req, res) => {
  const { workerId } = req.params;

  try {
    const deletedWorker = await Worker.findByIdAndDelete(workerId);

    if (!deletedWorker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.status(200).json({ message: 'Worker request declined successfully.' });
  } catch (error) {
    console.error('Error declining worker:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get Workers with approved: false
export const getPendingWorkers = async (req, res) => {
  const { userCode } = req.session.user || req.session.company; // Get the logged-in user's or company's userCode

  try {
    const pendingWorkers = await Worker.find({ approved: false, userCode });

    res.status(200).json(pendingWorkers);
  } catch (error) {
    console.error('Error fetching pending workers:', error);
    res.status(500).json({ message: 'Failed to fetch pending workers.' });
  }
};

// Get Workers with approved: true
export const getApprovedWorkers = async (req, res) => {
  const { userCode } = req.session.user || req.session.company; // Get the logged-in user's or company's userCode

  try {
    const approvedWorkers = await Worker.find({ approved: true, userCode });

    res.status(200).json(approvedWorkers);
  } catch (error) {
    console.error('Error fetching approved workers:', error);
    res.status(500).json({ message: 'Failed to fetch approved workers.' });
  }
};

// Update a worker's details
export const updateWorker = async (req, res) => {
  const { workerId } = req.params;
  const { name, email, phone, role, department, address, joiningDate } = req.body;

  try {
    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    // Ensure the user or company has permission to update the worker
    const userId = req.session.user ? req.session.user.id : null;
    const companyId = req.session.company ? req.session.company._id : null;

    if (userId && worker.userCode !== req.session.user.userCode) {
      return res.status(403).json({ message: 'You do not have permission to update this worker.' });
    }

    if (companyId && worker.userCode !== req.session.company.comp_code) {
      return res.status(403).json({ message: 'You do not have permission to update this worker.' });
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      workerId,
      { name, email, phone, role, department, address, joiningDate },
      { new: true }
    );

    if (!updatedWorker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.status(200).json({ message: 'Worker updated successfully!', worker: updatedWorker });
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Fetch a single worker by ID
export const getWorkerById = async (req, res) => {
  const { workerId } = req.params;

  try {
    const worker = await Worker.findById(workerId);

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.status(200).json(worker);
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Function to log in a worker
export const loginWorker = async (req, res) => {
  const { userCode, email, password } = req.body;

  try {
    const worker = await Worker.findOne({ userCode, email });

    if (!worker) {
      return res.status(401).json({ message: 'Invalid user code, email, or password.' });
    }

    if (!worker.approved) {
      return res.status(403).json({ message: 'Your account is not approved yet. Please contact support.' });
    }

    const isMatch = await bcrypt.compare(password, worker.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid user code, email, or password.' });
    }

    req.session.worker = { _id: worker._id, userCode: worker.userCode };

    res.status(200).json({ message: 'Login successful.', worker });
  } catch (error) {
    console.error('Error logging in worker:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Update worker's availability
export const updateWorkerAvailability = async (req, res) => {
  const { workerId } = req.params;
  const { date, shift } = req.body; // Expecting date and single shift from the request body

  try {
    if (!req.session.worker || req.session.worker._id !== workerId) {
      return res.status(401).json({ message: 'Unauthorized access.' });
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      workerId,
      { $push: { availability: { date, shift } } }, // Push new availability with single shift
      { new: true }
    );

    if (!updatedWorker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.status(200).json({ message: 'Worker availability updated successfully.', worker: updatedWorker });
  } catch (error) {
    console.error('Error updating worker availability:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Logout worker
export const logoutWorker = async (req, res) => {
  try {
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
    console.error('Error during logout:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get logged-in worker details
export const getLoggedInWorker = async (req, res) => {
  try {
    if (!req.session.worker || !req.session.worker._id) {
      return res.status(401).json({ message: 'No worker logged in.' });
    }

    const workerId = req.session.worker._id;

    const worker = await Worker.findById(workerId);

    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.status(200).json(worker);
  } catch (error) {
    console.error('Error fetching logged-in worker:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Upload worker image
export const uploadWorkerImage = async (req, res) => {
  const { workerId } = req.params;

  try {
    if (!req.session.worker || req.session.worker._id !== workerId) {
      return res.status(401).json({ message: 'Unauthorized access.' });
    }

    if (!req.body.image) {
      return res.status(400).json({ message: 'No image provided.' });
    }

    const updatedWorker = await Worker.findByIdAndUpdate(
      workerId,
      { image: req.body.image }, // Store the base64 image
      { new: true }
    );

    if (!updatedWorker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.status(200).json({ message: 'Image uploaded successfully.', worker: updatedWorker });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Fetch workers based on shift and date
export const getWorkersByShiftAndDate = async (req, res) => {
  const { date, shift } = req.query; // Expecting date and shift as query parameters

  try {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    // Get the userCode from the session
    const userCode = req.session.user ? req.session.user.userCode : req.session.company ? req.session.company.userCode : null;

    if (!userCode) {
      return res.status(403).json({ message: 'Unauthorized access. No user or company logged in.' });
    }

    // Find workers based on availability and userCode
    const workers = await Worker.find({
      availability: {
        $elemMatch: {
          date: parsedDate,
          shift: shift,
        },
      },
      userCode: userCode, // Filter by userCode
    });

    res.status(200).json(workers);
  } catch (error) {
    console.error('Error fetching workers by shift and date:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Fetch worker availability
export const getWorkerAvailability = async (req, res) => {
  const { workerId } = req.params;

  try {
    if (!req.session.worker || req.session.worker._id !== workerId) {
      return res.status(401).json({ message: 'Unauthorized access.' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    res.status(200).json(worker.availability); // Assuming availability is an array of objects with date and shift
  } catch (error) {
    console.error('Error fetching worker availability:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};