import Job from '../models/Job.js';
import Worker from '../models/Worker.js'; // Import the Worker model
import CompanyList from '../models/CompanyList.js'; // Import the CompanyList model
import nodemailer from 'nodemailer';


// Create a new job
// Create a new job
// Create a new job

const sendJobRequestEmail = async (email, name, jobTitle) => {
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
    subject: 'You\'ve been invited to a job!',
    text: `Hello ${name},

You have been invited to the job titled "${jobTitle}". Please check your app for more details.

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

export const createJob = async (req, res) => {
  const { title, description, location, date, shift, workersRequired } = req.body;

  // Get userCode from session (either from user or company)
  const userCode = req.session.user 
    ? req.session.user.userCode 
    : req.session.company 
    ? req.session.company.userCode 
    : null;

  if (!userCode) {
    return res.status(403).json({ message: "Unauthorized. User code is required." });
  }

  try {
    // Find all workers with the same userCode
    const allWorkers = await Worker.find({ userCode });

    if (allWorkers.length === 0) {
      return res.status(400).json({ message: "No workers found for this user code." });
    }

    // Filter workers who are available for the job's date & shift
    let availableWorkers = allWorkers.filter(worker =>
      worker.availability.some(avail => avail.date === date && avail.shift === shift)
    );

    // If no workers are available, invite everyone
    const invitedWorkers = availableWorkers.length > 0 ? availableWorkers : allWorkers;

    // Create the new job
    const newJob = new Job({
      title,
      description,
      location,
      date,
      shift,
      workersRequired,
      userCode, // Store the user code of the creator
      invitedWorkers: invitedWorkers.map(worker => worker._id), // Add only available workers or everyone
    });

    await newJob.save(); // Save job first

    // Update each invited worker
    const updatePromises = invitedWorkers.map(async (worker) => {
      worker.invitedJobs.push(newJob._id);
      worker.activities.push({
        timestamp: new Date(),
        message: `You have been invited to a new job: ${title}`,
      });
      await worker.save(); // Save worker
      await sendJobRequestEmail(worker.email, worker.name, title); // Send email invitation
    });

    await Promise.all(updatePromises); // Wait for all updates and emails to finish

    res.status(201).json({ message: "Job created and workers invited successfully!", job: newJob });
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Server error while creating job." });
  }
};



// Fetch jobs for the logged-in worker based on userCode and jobStatus false
export const getJobsForWorker = async (req, res) => {
  const workerId = req.session.worker ? req.session.worker._id : null;

  try {
    if (!workerId) {
      return res.status(400).json({ message: 'Worker ID is required.' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      console.log('Error: Worker not found');
      return res.status(404).json({ message: 'Worker not found.' });
    }

    const jobs = await Job.find({
      userCode: worker.userCode || req.session.company.comp_code, // Match company userCode
      invitedWorkers: workerId, // Only fetch jobs where the worker was invited
      workers: { $not: { $elemMatch: { $eq: workerId } } }, // Exclude jobs already accepted
    });

    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error while fetching jobs.' });
  }
};





// Fetch jobs with jobStatus true
export const getCompletedJobs = async (req, res) => {
  const workerId = req.session.worker ? req.session.worker._id : null; // Get the logged-in worker ID from the session

  try {
    // Find the worker
    const worker = workerId ? await Worker.findById(workerId) : null;

    if (workerId && !worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    // Fetch jobs where the userCode matches and jobStatus is true
    const jobs = await Job.find({ userCode: worker ? worker.userCode : req.session.company.comp_code, jobStatus: true, workers: workerId });
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching completed jobs:', error);
    res.status(500).json({ message: 'Server error while fetching completed jobs.' });
  }
};

// Accept a job
export const acceptJob = async (req, res) => {
  const { jobId } = req.params;
  const workerId = req.session.worker ? req.session.worker._id : null;

  console.log(`➡️ Accept Job Request Received - Job ID: ${jobId}, Worker ID: ${workerId}`);

  try {
    if (!workerId) {
      console.log('⛔ Unauthorized access: Worker ID missing');
      return res.status(403).json({ message: 'Unauthorized. Worker ID is required.' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      console.log(`⛔ Worker not found - ID: ${workerId}`);
      return res.status(404).json({ message: 'Worker not found.' });
    }

    console.log(`✅ Worker found: ${workerId}, Invited Jobs: ${worker.invitedJobs}`);
    console.log(`Worker Availability:`, worker.availability);

    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`⛔ Job not found - ID: ${jobId}`);
      return res.status(404).json({ message: 'Job not found.' });
    }

    console.log(`✅ Job found: ${jobId}, Date: ${job.date}, Shift: ${job.shift}, Job Status: ${job.jobStatus}`);

    // ❌ If jobStatus is true, prevent acceptance
    if (job.jobStatus) {
      console.log(`⚠️ Job ${jobId} is already filled.`);
      return res.status(400).json({ message: 'This job has already been filled and is no longer accepting workers.' });
    }

    // Ensure date comparison works correctly
    const isAvailable = worker.availability.some(avail => 
      new Date(avail.date).toISOString().split('T')[0] === new Date(job.date).toISOString().split('T')[0] &&
      avail.shift.toString() === job.shift.toString()
    );

    if (!isAvailable) {
      console.log(`⚠️ Worker ${workerId} is not available for this job`);
      return res.status(400).json({ message: 'You can only accept jobs that match your availability. Mark yourself available to accept.' });
    }

    // Remove jobId from worker's invitedJobs
    worker.invitedJobs = worker.invitedJobs.filter(id => id.toString() !== jobId);
    await worker.save();
    console.log(`🔄 Updated Worker: Removed Job ID from invitedJobs`);

    // Prevent duplicate acceptance
    if (job.workers.map(id => id.toString()).includes(workerId.toString())) {
      console.log(`⚠️ Worker ${workerId} has already accepted job ${jobId}`);
      return res.status(400).json({ message: 'You have already accepted this job.' });
    }

    // Add workerId to job's workers array
    job.workers.push(workerId);
    console.log(`🔄 Worker ${workerId} added to job ${jobId}`);

    // Update jobStatus if workersRequired is met
    if (job.workers.length >= job.workersRequired) {
      job.jobStatus = true;
      console.log(`✅ Job ${jobId} is now fully staffed and marked as completed`);
    }

    await job.save();
    console.log(`✅ Job ${jobId} updated successfully`);

    res.status(200).json({ message: 'Job accepted successfully!', job });
  } catch (error) {
    console.error('❌ Error accepting job:', error);
    res.status(500).json({ message: 'Server error while accepting job.' });
  }
};







// Decline a job invitation
export const declineJob = async (req, res) => {
  const { jobId } = req.params;
  const workerId = req.session.worker ? req.session.worker._id : null;

  console.log(`➡️ Decline Job Request Received - Job ID: ${jobId}, Worker ID: ${workerId}`);

  try {
    if (!workerId) {
      console.log('⛔ Unauthorized access: Worker ID missing');
      return res.status(403).json({ message: 'Unauthorized. Worker ID is required.' });
    }

    // Find the worker and remove jobId from invitedJobs
    const worker = await Worker.findById(workerId);
    if (!worker) {
      console.log(`⛔ Worker not found - ID: ${workerId}`);
      return res.status(404).json({ message: 'Worker not found.' });
    }

    console.log(`✅ Worker found: ${workerId}, Invited Jobs: ${worker.invitedJobs}`);

    // Remove jobId from worker's invitedJobs
    worker.invitedJobs = worker.invitedJobs.filter(id => id.toString() !== jobId);
    await worker.save();
    console.log(`🔄 Updated Worker: Removed Job ID from invitedJobs`);

    // Find the job
    const job = await Job.findById(jobId);
    if (!job) {
      console.log(`⛔ Job not found - ID: ${jobId}`);
      return res.status(404).json({ message: 'Job not found.' });
    }

    console.log(`✅ Job found: ${jobId}, Invited Workers: ${job.invitedWorkers}, Current Workers: ${job.workers}`);

    // Remove workerId from invitedWorkers
    job.invitedWorkers = job.invitedWorkers.filter(id => id.toString() !== workerId.toString());
    console.log(`🔄 Worker ${workerId} removed from invitedWorkers`);

    // If jobStatus was true, check if it should be reset
    if (job.jobStatus && job.workers.length < job.workersRequired) {
      job.jobStatus = false;
      console.log(`⚠️ Job ${jobId} does not meet required workers anymore, setting jobStatus to false`);
    }

    await job.save();
    console.log(`✅ Job ${jobId} updated successfully`);

    res.status(200).json({ message: 'Job invitation declined successfully!', job });
  } catch (error) {
    console.error('❌ Error declining job invitation:', error);
    res.status(500).json({ message: 'Server error while declining job invitation.' });
  }
};


// Update job status based on the number of workers
export const updateJobStatus = async (req, res) => {
  const { jobId } = req.params; // Get the job ID from the request parameters

  try {
    // Find the job by ID
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Check if the number of workers matches the workersRequired
    if (job.workers.length >= job.workersRequired) {
      job.jobStatus = true; // Update jobStatus to true
      await job.save(); // Save the updated job
      return res.status(200).json({ message: 'Job status updated to true.', job });
    } else {
      return res.status(400).json({ message: 'Not enough workers assigned to update job status.' });
    }
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ message: 'Server error while updating job status.' });
  }
};

// Fetch jobs for the logged-in worker where the worker ID is in the workers array
export const getMyTasks = async (req, res) => {
  const workerId = req.session.worker ? req.session.worker._id : null; // Get the logged-in worker ID from the session

  try {
    if (!workerId) {
      return res.status(400).json({ message: 'Worker ID is required.' });
    }

    // Fetch jobs where the worker ID is in the workers array
    const jobs = await Job.find({ workers: workerId });

    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching my tasks:', error);
    res.status(500).json({ message: 'Server error while fetching my tasks.' });
  }
};


// Fetch jobs for the logged-in company
// Fetch jobs for a specific user or company based on user code
export const getJobsForUserAndCompany  = async (req, res) => {
  const userId = req.session.user ? req.session.user.id : null; // Get the logged-in user ID from the session
  const companyId = req.session.company ? req.session.company._id : null; // Get the logged-in company ID from the session

  try {
    let jobs;

    if (userId) {
      // Fetch jobs for the user
      jobs = await Job.find({ userCode: req.session.user.userCode });
    } else if (companyId) {
      // If user does not exist, fetch jobs for the company
      jobs = await Job.find({ userCode: req.session.company.userCode });
    } else {
      return res.status(403).json({ message: 'Unauthorized. User or company ID is required.' });
    }

    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs for user or company:', error);
    res.status(500).json({ message: 'Server error while fetching jobs.' });
  }
};

export const getJobById = async (req, res) => {
  const jobId = req.params.id; // Get jobId from request parameters
  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }
    res.status(200).json(job); // Return the job details
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ message: 'Server error while fetching job.' });
  }
};

// controllers/jobController.js

// Invite workers to a job
export const inviteWorkersToJob = async (req, res) => {
  const { jobId } = req.params;
  const { workerIds } = req.body; // Array of worker IDs

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Add worker IDs to the invitedWorkers array
    job.invitedWorkers.push(...workerIds);
    await job.save();

    res.status(200).json({ message: 'Workers invited successfully!', job });
  } catch (error) {
    console.error('Error inviting workers:', error);
    res.status(500).json({ message: 'Server error while inviting workers.' });
  }
};

// Fetch jobs that a worker has been invited to
export const getInvitedJobsForWorker = async (req, res) => {
  const workerId = req.session.worker ? req.session.worker._id : null; // Get the logged-in worker ID from the session

  console.log('Worker ID:', workerId); // Log the worker ID

  if (!workerId) {
    return res.status(403).json({ message: 'Unauthorized. Worker ID is required.' });
  }

  try {
    const jobs = await Job.find({ invitedWorkers: workerId });
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching invited jobs:', error);
    res.status(500).json({ message: 'Server error while fetching invited jobs.' });
  }
};

// Accept a job invitation
// Accept or decline a job invitation
export const respondToJobInvitation = async (req, res) => {
  const { jobId, response } = req.body; // response can be 'accept' or 'decline'
  const workerId = req.session.worker ? req.session.worker._id : null; // Get the logged-in worker ID from the session

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    if (job.jobStatus === true) {
      return res.status(400).json({ message: 'The job requirements have already been fulfilled. No more workers can be accepted.' });
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
      // Remove worker from invitedWorkers
      job.invitedWorkers = job.invitedWorkers.filter(id => id.toString() !== workerId.toString());
    }

    await job.save();
    res.status(200).json({ message: `Job invitation ${response}ed successfully!`, job });
  } catch (error) {
    console.error('Error responding to job invitation:', error);
    res.status(500).json({ message: 'Server error while responding to job invitation.' });
  }
};


// Get the total count of jobs
export const getTotalJobCount = async (req, res) => {
  try {
    // Get the count of all jobs in the database
    const jobCount = await Job.countDocuments();

    res.status(200).json({ totalJobs: jobCount });
  } catch (error) {
    console.error('Error fetching job count:', error);
    res.status(500).json({ message: 'Server error while fetching job count.' });
  }
};

// Fetch all jobs
export const getAllJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('workers invitedWorkers'); // Populate workers and invitedWorkers for detailed info
    if (!jobs || jobs.length === 0) {
      return res.status(404).json({ message: 'No jobs found' });
    }
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching all jobs:', error);
    res.status(500).json({ message: 'Server error while fetching all jobs.' });
  }
};

// Fetch job details by ID
export const getJobDetailsById = async (req, res) => {
  const { id } = req.params; // Get job ID from request parameters

  try {
    const job = await Job.findById(id)
      .populate('workers', 'name email phone') // Populate worker details
      .populate('invitedWorkers', 'name email phone'); // Populate invited worker details

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.status(200).json(job); // Return the job details
  } catch (error) {
    console.error('Error fetching job details:', error);
    res.status(500).json({ message: 'Server error while fetching job details.' });
  }
};

// Update Job
export const updateJob = async (req, res) => {
  const { id } = req.params;
  const { title, description, location, workersRequired } = req.body;

  try {
    const updatedJob = await Job.findByIdAndUpdate(
      id,
      { title, description, location, workersRequired },
      {
        new: true, // Return the updated document
        runValidators: true, // Validate before updating
      }
    );

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Failed to update job" });
  }
};

export const deleteJob = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedJob = await Job.findByIdAndDelete(id);

    if (!deletedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Failed to delete job" });
  }
};

// Remove an accepted job (worker deletes it)
export const removeAcceptedJob = async (req, res) => {
  const { jobId } = req.params;
  const workerId = req.session.worker ? req.session.worker._id : null; // Get the logged-in worker ID from the session

  // Validate jobId
  if (!jobId || jobId.length !== 24) {
    return res.status(400).json({ message: 'Invalid job ID.' });
  }

  // Validate workerId
  if (!workerId) {
    return res.status(403).json({ message: 'Unauthorized. Worker ID is required.' });
  }

  try {
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Check if the worker is part of the job
    if (!job.workers.map(id => id.toString()).includes(workerId.toString())) {
      return res.status(400).json({ message: 'You have not accepted this job.' });
    }

    // Remove the worker from the job's workers array
    job.workers = job.workers.filter(id => id.toString() !== workerId.toString());

    // If job was previously marked as completed and a worker removes themselves, re-evaluate jobStatus
    if (job.jobStatus && job.workers.length < job.workersRequired) {
      job.jobStatus = false; // Set back to false if workers drop below required count
    }

    await job.save(); // Save the updated job

    res.status(200).json({ message: 'Job removed successfully!', job });
  } catch (error) {
    console.error('Error removing job:', error);
    res.status(500).json({ message: 'Server error while removing job.' });
  }
};

