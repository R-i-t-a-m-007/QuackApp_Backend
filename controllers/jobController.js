// controllers/jobController.js
import Job from '../models/Job.js';

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