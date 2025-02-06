// routes/jobRoutes.js
import express from 'express';
import { createJob, getJobsForWorker, getCompletedJobs, updateJobStatus, acceptJob, getMyTasks, getJobsForCompany } from '../controllers/jobController.js';
import { sessionMiddleware } from '../middlewares/sessionMiddleware.js';

const router = express.Router();

router.post('/create', sessionMiddleware, createJob); // Route to create a job
router.get('/worker', sessionMiddleware, getJobsForWorker); // Route to fetch jobs for the logged-in worker
router.get('/completed', sessionMiddleware, getCompletedJobs); // Route to fetch completed jobs for the logged-in worker
router.put('/status/:jobId', sessionMiddleware, updateJobStatus); // Route to update job status
router.put('/accept/:jobId', sessionMiddleware, acceptJob); // Route to accept a job
router.get('/mine', sessionMiddleware, getMyTasks); // Route to fetch jobs where the worker ID is in the workers array
router.get('/company', sessionMiddleware, getJobsForCompany); // New route to fetch jobs for the logged-in company


export default router;