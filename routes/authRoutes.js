import express from 'express';
import { registerUser , loginUser , getLoggedInUser , logoutUser , requestOtp, resetPassword, storeSelectedPackage,getSessionData,updateUserPackage, uploadUserImage } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Routes
router.post('/register', registerUser );
router.post('/login', loginUser );
router.get('/me', getLoggedInUser );
router.post('/logout', logoutUser );
router.post('/request-otp', requestOtp);
router.post('/reset-password', resetPassword);
router.post('/store-package', storeSelectedPackage); // Add this line
router.get('/session', getSessionData);
router.post('/updatepackage', updateUserPackage); // New route for updating package
router.post('/upload-image', uploadUserImage); // New route for uploading user image



export default router;