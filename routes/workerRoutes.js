import express from 'express';
import { addWorker, getWorkers, updateWorker, deleteWorker, loginWorker, logoutWorker, updateWorkerAvailability, getLoggedInWorker, uploadWorkerImage, getWorkersByShiftAndDate } from '../controllers/workerController.js';
import { sessionMiddleware } from '../middlewares/sessionMiddleware.js';

const router = express.Router();

// Ensure that only individual users can add and see workers
router.post('/add', sessionMiddleware, addWorker);
router.get('/list', sessionMiddleware, getWorkers);
router.put('/:workerId', sessionMiddleware, updateWorker);
router.delete('/:workerId', deleteWorker);
router.post('/login', loginWorker); // Add this line for worker login
router.get('/me', getLoggedInWorker);
router.put('/:workerId/availability', sessionMiddleware, updateWorkerAvailability);
router.post('/logout', logoutWorker);
router.post('/:workerId/upload-image', sessionMiddleware, uploadWorkerImage); // New route for image upload
router.get('/shift-date', sessionMiddleware, getWorkersByShiftAndDate);


export default router;