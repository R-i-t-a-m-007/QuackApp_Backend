import express from 'express';
import { addWorker, getWorkers, updateWorker, deleteWorker,loginWorker } from '../controllers/workerController.js';
import { sessionMiddleware } from '../middlewares/sessionMiddleware.js';

const router = express.Router();

// Ensure that only individual users can add and see workers
router.post('/add', sessionMiddleware, addWorker);
router.get('/list', sessionMiddleware, getWorkers);
router.put('/:workerId', sessionMiddleware, updateWorker);
router.delete('/:workerId', deleteWorker);
router.post('/login', loginWorker); // Add this line for worker login


export default router;
