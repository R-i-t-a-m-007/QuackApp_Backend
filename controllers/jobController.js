// controllers/jobController.js
import Job from '../models/Job.js';
import Worker from '../models/Worker.js'; // Import the Worker model

export const createJob = async (req, res) => {
  const { title, description, location, date, shift, workersRequired } = req.body;
  const userCode = req.session.user.userCode; // Assuming userCode is stored in the session

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
  const workerId = req.session.worker._id; // Get the logged-in worker ID from the session

  try {
    // Find the worker
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    // Fetch jobs where the userCode matches and jobStatus is false
    const jobs = await Job.find({ userCode: worker.userCode, jobStatus: false });
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({ message: 'Server error while fetching jobs.' });
  }
};

// Fetch jobs with jobStatus true
export const getCompletedJobs = async (req, res) => {
  const workerId = req.session.worker._id; // Get the logged-in worker ID from the session

  try {
    // Find the worker
    const worker = await Worker.findById(workerId);
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }

    // Fetch jobs where the userCode matches and jobStatus is true
    const jobs = await Job.find({ userCode: worker.userCode, jobStatus: true });
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching completed jobs:', error);
    res.status(500).json({ message: 'Server error while fetching completed jobs.' });
  }
};

export const updateJobStatus = async (req, res) => {
  const { jobId } = req.params; // Get the job ID from the request parameters

  try {
    // Find the job by ID
    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found.' });
    }

    // Check if the number of workers matches the workersRequired
    if (job.workers && job.workers.length >= job.workersRequired) {
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