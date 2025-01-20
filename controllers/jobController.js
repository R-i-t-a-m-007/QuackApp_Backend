// controllers/jobController.js
import Job from '../models/Job.js';
import Worker from '../models/Worker.js'; // Import the Worker model


export const createJob = async (req, res) => {
  const { title, description, location, date, shift, workersRequired } = req.body;
  const companyId = req.session.company._id; // Get the logged-in company ID from the session
  console.log('Company ID:', companyId); // Log the company ID


  try {
    const newJob = new Job({
      title,
      description,
      location,
      date,
      shift,
      workersRequired,
      companyId, // Associate the job with the company
    });

    await newJob.save();
    res.status(201).json({ message: 'Job created successfully!', job: newJob });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ message: 'Server error while creating job.' });
  }
};

// Fetch jobs for a specific company
export const getJobsByCompany = async (req, res) => {
    const companyId = req.session.company._id; // Get the logged-in company ID
  
    try {
      const jobs = await Job.find({ companyId }).populate('companyId', 'name email'); // Populate company details
      res.status(200).json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: 'Server error while fetching jobs.' });
    }
  };

  // Fetch jobs for the company associated with the logged-in worker
export const getJobsForWorker = async (req, res) => {
    const workerId = req.session.worker._id; // Get the logged-in worker ID from the session
  
    try {
      // Find the worker and populate the company field
      const worker = await Worker.findById(workerId).populate('company');
      
      if (!worker || !worker.company) {
        return res.status(404).json({ message: 'Worker or associated company not found.' });
      }
  
      // Fetch jobs for the associated company
      const jobs = await Job.find({ companyId: worker.company._id });
      res.status(200).json(jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      res.status(500).json({ message: 'Server error while fetching jobs.' });
    }
  };