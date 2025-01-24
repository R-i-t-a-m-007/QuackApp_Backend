import Worker from '../models/Worker.js';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

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

// Function to send registration acknowledgment email without credentials
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
    // Delete the worker request
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
  const { userCode } = req.session.user; // Get the logged-in user's userCode
  console.log('User  Code:', userCode); // Log the user code

  try {
    // Fetch all workers with approved: false and matching userCode
    const pendingWorkers = await Worker.find({ approved: false, userCode });

    console.log('Pending Workers:', pendingWorkers); // Log the fetched workers
    res.status(200).json(pendingWorkers);
  } catch (error) {
    console.error('Error fetching pending workers:', error);
    res.status(500).json({ message: 'Failed to fetch pending workers.' });
  }
};

// Get Workers with approved: true
export const getApprovedWorkers = async (req, res) => {
  const { userCode } = req.session.user; // Get the logged-in user's userCode

  try {
    // Fetch all workers with approved: true and matching userCode
    const approvedWorkers = await Worker.find({ approved: true, userCode });

    res.status(200).json(approvedWorkers);
  } catch (error) {
    console.error('Error fetching approved workers:', error);
    res.status(500).json({ message: 'Failed to fetch approved workers.' });
  }
};

// Other functions remain unchanged...

// Update a worker's details
export const updateWorker = async (req, res) => {
  const { workerId } = req.params;
  const { name, email, phone, role, department, address, joiningDate } = req.body;

  try {
    // Update the worker's details
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
    // Fetch the worker by ID
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
  const { userCode, password } = req.body;

  try {
    // Find the worker by userCode
    const worker = await Worker.findOne({ userCode });
    console.log('Worker found:', worker); // Log the worker object

    // Check if the worker exists and if they are approved
    if (!worker) {
      return res.status(401).json({ message: 'Invalid user code or password.' });
    }

    // Check if the worker is approved
    if (!worker.approved) {
      return res.status(403).json({ message: 'Your account is not approved yet. Please contact support.' });
    }

    // Log the password being compared
    console.log('Password being sent:', password); // Log the password
    console.log('Stored hashed password:', worker.password); // Log the stored hashed password

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, worker.password);
    console.log('Password match:', isMatch); // Log the result of the password comparison

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid user code or password.' });
    }

    // Create a session for the logged-in worker
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
    // Ensure a worker is logged in
    if (!req.session.worker || req.session.worker._id !== workerId) {
      return res.status(401).json({ message: 'Unauthorized access.' });
    }

    // Update worker's availability
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
    console.error('Error during logout:', error);
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
    console.error('Error fetching logged-in worker:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const uploadWorkerImage = async (req, res) => {
  const { workerId } = req.params;

  try {
    // Ensure the worker is logged in
    if (!req.session.worker || req.session.worker._id !== workerId) {
      return res.status(401).json({ message: 'Unauthorized access.' });
    }

    // Check if an image was uploaded
    if (!req.body.image) {
      return res.status(400).json({ message: 'No image provided.' });
    }

    // Update worker with the image (base64 string)
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
    // Convert date string to Date object
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid date format.' });
    }

    // Fetch workers who are available on the specified date and shift
    const workers = await Worker.find({
      availability: {
        $elemMatch: {
          date: parsedDate,
          shift: shift,
        },
      },
    });

    res.status(200).json(workers);
  } catch (error) {
    console.error('Error fetching workers by shift and date:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};