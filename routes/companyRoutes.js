import express from 'express';
import { addCompany, getCompanies, updateCompany, deleteCompany, companyLogin, logout, getLoggedInCompany } from '../controllers/companyController.js';
import { sessionMiddleware } from '../middlewares/sessionMiddleware.js';

const router = express.Router();

router.post('/login', companyLogin); // Add login route
router.post('/logout', logout);
router.post('/add', sessionMiddleware, addCompany);
router.get('/list', sessionMiddleware, getCompanies);
router.put('/:companyId', sessionMiddleware, updateCompany);
router.delete('/:id', sessionMiddleware, deleteCompany);
router.get('/company', getLoggedInCompany);


export default router;
