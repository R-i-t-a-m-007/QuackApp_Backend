// routes/jobRoutes.js
import express from 'express';
import { createJob, getJobsByCompany, getJobsForWorker } from '../controllers/jobController.js';
import { sessionMiddleware } from '../middlewares/sessionMiddleware.js';

const router = express.Router();

router.post('/create', sessionMiddleware, createJob); // Route to create a job
router.get('/company', sessionMiddleware, getJobsByCompany); // Route to fetch jobs for the logged-in company
router.get('/worker', sessionMiddleware, getJobsForWorker); // Route to fetch jobs for the logged-in worker


export default router;