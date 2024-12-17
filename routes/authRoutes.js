import express from 'express';
import { registerUser, loginUser,getLoggedInUser, logoutUser } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import { getSessionData } from '../controllers/authController.js';
const router = express.Router();

// Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', getLoggedInUser);
router.post('/logout', logoutUser);
router.get('/session', getSessionData);



export default router;

