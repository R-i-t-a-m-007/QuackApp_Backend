import express from 'express';
import { createPaymentIntent, createSubscription } from '../controllers/stripeController.js';
const router = express.Router();

// POST: Create a Stripe Checkout session
router.post('/create-checkout-session', createPaymentIntent);
router.post('/create-subscription', createSubscription);

export default router;
