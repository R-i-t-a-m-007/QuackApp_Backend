// stripeController.js
import stripeLib from 'stripe';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { priceId } = req.body; // Ensure this is passed from the frontend

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required to create a payment intent.' });
    }

    // Fetch the price details from Stripe using the price ID
    const price = await stripe.prices.retrieve(priceId);

    // Check if the price is valid
    if (!price || !price.unit_amount) {
      return res.status(400).json({ error: 'Invalid price ID or price details not found.' });
    }

    // Create a Payment Intent with the price amount
    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount, // Use the unit_amount (in cents)
      currency: price.currency, // Currency from the price details
      payment_method_types: ['card'],
    });

    // Return the client secret to the frontend
    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe Payment Intent Error:', error.message);
    res.status(500).json({ error: 'Failed to create payment intent. Please try again later.' });
  }
};

