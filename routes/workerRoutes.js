import express from 'express';
import { addWorker, getWorkers, updateWorker, deleteWorker,workerLogin,workerLogout,getLoggedInWorker } from '../controllers/workerController.js';
import { sessionMiddleware } from '../middlewares/sessionMiddleware.js';

const router = express.Router();

// Ensure that only individual users can add and see workers
router.post('/add', sessionMiddleware, addWorker);
router.get('/list', sessionMiddleware, getWorkers);
router.put('/:workerId', sessionMiddleware, updateWorker);
router.delete('/workers/:workerId', deleteWorker);
router.post('/login', workerLogin);
router.post('/logout', workerLogout);
router.get('/worker', getLoggedInWorker);


export default router;
