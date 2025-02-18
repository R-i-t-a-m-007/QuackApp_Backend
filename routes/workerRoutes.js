import express from 'express';
import {
  addWorker,
  getPendingWorkers,
  getApprovedWorkers,
  approveWorker,
  declineWorker,
  updateWorker,
  loginWorker,
  logoutWorker,
  updateWorkerAvailability,
  getLoggedInWorker,
  uploadWorkerImage,
  getWorkersByShiftAndDate,
  getWorkerAvailability,
  inviteWorkerToJob, // New import for inviting workers
  getInvitedJobsForWorker, // New import for fetching invited jobs
  respondToJobInvitation, // New import for responding to job invitations
  getAllWorkers,
  updateWorkerDetails
} from '../controllers/workerController.js';
import { sessionMiddleware } from '../middlewares/sessionMiddleware.js';

const router = express.Router();

// Ensure that only individual users can add and see workers
router.post('/add', addWorker); // Add a new worker
router.get('/pending', sessionMiddleware, getPendingWorkers); // Get workers with approved: false
router.get('/approved', sessionMiddleware, getApprovedWorkers); // Get workers with approved: true
router.put('/approve/:workerId', sessionMiddleware, approveWorker); // Approve a worker
router.delete('/decline/:workerId', sessionMiddleware, declineWorker); // Decline a worker
router.put('/:workerId', sessionMiddleware, updateWorker); // Update a worker's details
router.post('/login', loginWorker); // Worker login
router.get('/me', getLoggedInWorker); // Get logged-in worker's details
router.put('/:workerId/availability', sessionMiddleware, updateWorkerAvailability); // Update worker's availability
router.post('/logout', logoutWorker); // Worker logout
router.post('/:workerId/upload-image', sessionMiddleware, uploadWorkerImage); // Route for image upload
router.get('/shift-date', sessionMiddleware, getWorkersByShiftAndDate); // Fetch workers based on shift and date
router.get('/:workerId/availability-status', sessionMiddleware, getWorkerAvailability); // Fetch availability status

// New routes for job invitations
router.post('/invite/:workerId', sessionMiddleware, inviteWorkerToJob); // Invite a worker to a job
router.get('/invited-jobs', sessionMiddleware, getInvitedJobsForWorker); // Fetch jobs that a worker has been invited to
router.post('/respond-invitation', sessionMiddleware, respondToJobInvitation); // Respond to job invitation
router.get('/workers',getAllWorkers);
router.put("/update/:workerId", updateWorkerDetails);

export default router;