import express from 'express';
import { createPaymentIntent } from '../controllers/stripeController.js';
const router = express.Router();

// POST: Create a Stripe Checkout session
router.post('/create-checkout-session', createPaymentIntent);

export default router;
