import express from 'express';
import { registerUser , loginUser , getLoggedInUser , logoutUser , requestOtp, resetPassword, storeSelectedPackage,getSessionData,updateUserPackage, uploadUserImage, getAllUsers, updateUserDetails, deleteUser, getUserById, getTotalPrice } from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser );
router.post('/login', loginUser );
router.get('/me', getLoggedInUser );
router.post('/logout', logoutUser );
router.post('/request-otp', requestOtp);
router.post('/reset-password', resetPassword);
router.post('/store-package', storeSelectedPackage); // Add this line
router.get('/session', getSessionData);
router.post('/updatepackage', updateUserPackage); // New route for updating package
router.post('/:userId/upload-image', uploadUserImage); // New route for uploading user image
router.get('/users', getAllUsers); // API to get all users
router.put('/update/:userId', updateUserDetails);
router.delete('/users/:userId', deleteUser);
router.get("/users/:id",getUserById);
router.get('/total-price', getTotalPrice);




export default router;