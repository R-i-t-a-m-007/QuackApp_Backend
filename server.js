import express from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
                                                   
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import MongoStore from 'connect-mongo';

import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import workerRoutes from './routes/workerRoutes.js'
import stripeRoutes from './routes/stripeRoutes.js'
import jobRoutes from './routes/jobRoutes.js'; // Import job routes
import adminRoutes from './routes/adminRoutes.js';


dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

app.use(compression());
app.use(helmet());
app.use(mongoSanitize());


app.set('trust proxy', 1);

const allowedOrigins = [
  'https://quackapp-admin.netlify.app',
  undefined, // for mobile apps like Expo (they often send undefined origin)
  "https://thequackapp.com"
];

// Configure session middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',   // Set to true if using HTTPS
      sameSite: 'None',     // Required for cross-origin
    },
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
  })
);
app.use("/healthcheck", (req,res)=>{
  res.status(200).send("ok");
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
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true, // Allow cookies
  })
);

// Middleware
app.use(express.json({ limit: '50mb' })); // Increase to 50 MB
app.use(express.urlencoded({ limit: '50mb', extended: true }));


// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/jobs', jobRoutes); // Add job routes
app.use('/api/admin', adminRoutes);

       


// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

