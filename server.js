import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cron from 'node-cron';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import workerRoutes from './routes/workerRoutes.js'
import stripeRoutes from './routes/stripeRoutes.js'
import jobRoutes from './routes/jobRoutes.js'; // Import job routes
import adminRoutes from './routes/adminRoutes.js';
import { checkExpiringSubscriptions } from './controllers/authController.js';


dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,  // Prevent JS from accessing cookie
      secure: false,   // Set to true if using HTTPS
      sameSite: 'lax',
     }, // 1-day cookie
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  })
);

// Configure CORS
app.use(
  cors({
    origin: 'https://quackapp-admin.netlify.app',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Allow cookies
  })
);

// Middleware
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));


// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/jobs', jobRoutes); // Add job routes
app.use('/api/admin', adminRoutes);

cron.schedule('0 0 * * *', () => {
  console.log('Checking for expiring subscriptions...');
  checkExpiringSubscriptions();
});




// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

