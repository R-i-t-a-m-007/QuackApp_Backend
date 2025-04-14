import express from 'express';
import { saveUserPushToken, saveWorkerPushToken, saveCompanyPushToken } from '../controllers/pushTokenController.js';

const router = express.Router();

// Save push token for User
router.post('/user', saveUserPushToken);

// Save push token for Worker
router.post('/worker', saveWorkerPushToken);

// Save push token for Company
router.post('/company', saveCompanyPushToken);

export default router;
