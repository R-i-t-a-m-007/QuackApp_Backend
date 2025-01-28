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
  fetchWorkerAvailabilityStatus
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
router.get('/:workerId/availability-status', sessionMiddleware, fetchWorkerAvailabilityStatus); // New route for fetching availability status

export default router;