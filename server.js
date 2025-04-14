import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import pushTokenRoutes from './routes/pushTokenRoutes.js'; // Import push notification routes

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
  'https://quackapp-admin.netlify.app',
  'http://localhost:3000', // admin panel dev
  undefined, // for mobile apps like Expo (they often send undefined origin)
  'http://localhost:5173',
];

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,  // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',   // Set to true if using HTTPS
      sameSite: 'None',  // Required for cross-origin requests
    },
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  })
);

// Health check endpoint for monitoring
app.use("/healthcheck", (req, res) => {
  res.status(200).send("OK");
});

// Configure CORS
app.use(
  cors({
    origin: function (origin, callback) {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
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
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/pushToken', pushTokenRoutes);  // Use push notification routes

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : null,
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
