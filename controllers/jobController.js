import Job from '../models/Job.js';
import Worker from '../models/Worker.js'; // Import the Worker model
import CompanyList from '../models/CompanyList.js'; // Import the CompanyList model

// Create a new job
// Create a new job
// Create a new job
export const createJob = async (req, res) => {
  const { title, description, location, date, shift, workersRequired } = req.body;

  // Get userCode from session (either from user or company)
  const userCode = req.session.user ? req.session.user.userCode : req.session.company ? req.session.company.userCode : null;

  if (!userCode) {
    return res.status(403).json({ message: 'Unauthorized. User code is required.' });
  }

  try {
    const newJob = new Job({
      title,
      description,
      location,
      date,
      shift,
      workersRequired,
      userCode, // Store the user code of the creator
    });

    await newJob.save();
    res.status(201).json({ message: 'Job created successfully!', job: newJob });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error while creating job.' });
  }
};
// Fetch jobs for the logged-in worker based on userCode and jobStatus false
export const getJobsForWorker = async (req, res) => {
  const workerId = req.session.worker ? req.session.worker._id : null;
  console.log('Worker ID:', workerId); // Debugging

  try {
    if (!workerId) {
      console.log('Error: Worker ID is missing');
      return res.status(400).json({ message: 'Worker ID is required.' });
    }

    const worker = await Worker.findById(workerId);
    if (!worker) {
      console.log('Error: Worker not found');
      return res.status(404).json({ message: 'Worker not found.' });
    }

    const jobs = await Job.find({
      userCode: worker.userCode || req.session.company.comp_code,
      jobStatus: false,
      invitedWorkers: workerId,
      workers: { $ne: workerId },
    });

    console.log('Jobs found:', jobs); // Debugging
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
  const { jobId } = req.params; // Get the job ID from the request parameters
  const workerId = req.session.worker ? req.session.worker._id : null; // Get the logged-in worker ID from the session

  try {
    // Find the job by ID
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Ensure workers is an array
    if (!Array.isArray(job.workers)) {
      job.workers = []; // Initialize as an empty array if it's null
    }

    // Check if the worker is already in the workers array
    if (workerId && job.workers.includes(workerId)) {
      return res.status(400).json({ message: 'You have already accepted this job.' });
    }

    // Add the worker ID to the job
    if (workerId) {
      job.workers.push(workerId); // Add worker ID to the workers array
    }

    await job.save(); // Save the updated job

    // Check if the number of workers matches the workersRequired
    if (job.workers.length >= job.workersRequired) {
      job.jobStatus = true; // Update jobStatus to true
    }

    await job.save(); // Save the updated job again if jobStatus changed

    res.status(200).json({ message: 'Job accepted successfully!', job });
  } catch (error) {
    console.error('Error accepting job:', error);
    res.status(500).json({ message: 'Server error while accepting job.' });
  }
};

// Decline a job invitation
export const declineJob = async (req, res) => {
  const { jobId } = req.params; // Get the job ID from the request parameters
  const workerId = req.session.worker ? req.session.worker._id : null; // Get the logged-in worker ID from the session

  try {
    // Find the job by ID
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Remove worker from invitedWorkers
    job.invitedWorkers = job.invitedWorkers.filter(id => id.toString() !== workerId.toString());

    await job.save(); // Save the updated job

    res.status(200).json({ message: 'Job invitation declined successfully!', job });
  } catch (error) {
    console.error('Error declining job invitation:', error);
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
    // Fetch jobs where the worker ID is in the workers array
    const jobs = await Job.find({ workers: workerId }); // Find jobs where the worker ID is included in the workers array
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
    console.log('Invited Jobs:', jobs); // Log the jobs found
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