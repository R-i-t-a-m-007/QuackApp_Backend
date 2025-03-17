// stripeController.js
import stripeLib from 'stripe';
import dotenv from 'dotenv';
import User from '../models/User.js';

// Load environment variables
dotenv.config();

const stripe = stripeLib(process.env.STRIPE_SECRET_KEY);

export const createPaymentIntent = async (req, res) => {
  try {
    const { priceId, customerId } = req.body; // ✅ Ensure customerId is received

    if (!priceId || !customerId) {
      return res.status(400).json({ error: 'Price ID and Customer ID are required.' });
    }

    // Fetch the price details from Stripe using the price ID
    const price = await stripe.prices.retrieve(priceId);
    if (!price || !price.unit_amount) {
      return res.status(400).json({ error: 'Invalid price ID.' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: price.unit_amount,
      currency: price.currency,
      customer: customerId, // 
      payment_method_types: ['card'],
    });

    res.status(200).json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Stripe Payment Intent Error:', error.message);
    res.status(500).json({ error: 'Failed to create payment intent.' });
  }
};


export const createSubscription = async (req, res) => {
  try {
    const { customerId, priceId } = req.body; // Ensure these are passed from the frontend
    console.log('Received subscription data:', req.body); 

    if (!customerId || !priceId) {
      return res.status(400).json({ error: 'Customer ID and Price ID are required.' });
    }

    // Create a subscription in Stripe
    const subscription = await stripe.subscriptions.create({
      customer: customerId, // The Stripe customer ID
      items: [{ price: priceId }],
      expand: ['latest_invoice.payment_intent'], // Optional: to get payment intent details
      payment_behavior: 'default_incomplete',
    });

    // Return the subscription details to the frontend
    res.status(200).json({ subscription });
  } catch (error) {
    console.error('Stripe Create Subscription Error:', error.message);
    res.status(500).json({ error: 'Failed to create subscription. Please try again later.' });
  }
};

// In your stripeController.js
export const attachPaymentMethod = async (req, res) => {
  const { customerId, paymentMethodId } = req.body;
  console.log('Received data:', req.body);

  if (!customerId || !paymentMethodId) {
    console.error('Error: Missing customerId or paymentMethodId');
    return res.status(400).json({ error: 'customerId and paymentMethodId are required.' });
  }

  try {
    // Attach the payment method to the customer
    await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId, confirm: true, });

    // Set the payment method as the default for the customer
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    res.status(200).json({ message: 'Payment method attached successfully.' });
  } catch (error) {
    console.error('Error attaching payment method:', error);
    res.status(500).json({ error: 'Failed to attach payment method.' });
  }
};

export const cancelSubscription = async (req, res) => {
  try {
    const userId = eq.session.user ? req.session.user.id : null;
    const user = await User.findById(userId);

    if (!user || !user.stripeSubscriptionId) {
      return res.status(400).json({ message: 'User subscription not found' });
    }

    // Cancel the subscription in Stripe
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true, // Cancels at the end of the billing cycle
    });

    // Optionally update the user record
    user.subscriptionStatus = 'canceled';
    await user.save();

    res.json({
      message: 'Subscription will be canceled at the end of the billing cycle.',
      subscription,
    });
  } catch (error) {
    console.error('Cancel Subscription Error:', error);
    res.status(500).json({ message: 'Error canceling subscription' });
  }
};