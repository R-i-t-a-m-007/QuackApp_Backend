import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Function to send emails
const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // Use your email service
    auth: {
      user: process.env.EMAIL_USER, // Your email
      pass: process.env.EMAIL_PASS, // Your email password or app password
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text,
  };

  return transporter.sendMail(mailOptions);
};

// Register User
export const registerUser = async (req, res) => {
  const { username, email, phone, address, postcode, password } = req.body;

  try {
    // Check if username or email already exists
    const existingUsername = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });

    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      email,
      phone,
      address,
      postcode,
      password: hashedPassword,
    });

    await newUser.save();

    // Set session for the newly registered user
    req.session.user = { id: newUser._id, username: newUser.username };

    // Send a welcome email
    const subject = 'Welcome to Our Service!';
    const text = `Dear ${username},

Thank you for registering as a Pro User. We are thrilled to have you as part of our community.
    
Your account credentials are:
- Username: ${username}
- Password: ${password}

Please ensure to keep this information secure. Feel free to reach out to our support team if you need assistance.

Warm regards,  
The QuackApp Team`;

    await sendEmail(email, subject, text);

    return res.status(200).json({ message: 'Registration successful', user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed. Please try again later.' });
  }
};

// Login User
// Login User
export const loginUser = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find the user by username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Set session
    req.session.user = { id: user._id, username: user.username };

    // Generate JWT
    const payload = { id: user._id, username: user.username };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, message: 'Login successful!', user: req.session.user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};


// Logout User
export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ message: 'Error logging out.' });
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.status(200).json({ message: 'Logout successful.' });
  });
};

// Get Logged In User
export const getLoggedInUser = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ message: 'No user logged in' });
    }

    const user = await User.findById(req.session.user.id).select('-password'); // Exclude password

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Store Selected Package
export const storeSelectedPackage = async (req, res) => {
  const { packageName } = req.body;

  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ message: 'No user logged in' });
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.package = packageName;
    await user.save();

    res.status(200).json({ message: 'Package selection saved successfully.' });
  } catch (error) {
    console.error('Error saving package:', error);
    res.status(500).json({ message: 'Failed to save package.' });
  }
};

// Request OTP for Password Reset
export const requestOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpire = Date.now() + 3600000; // OTP valid for 1 hour
    await user.save();

    // Send OTP to user's email
    const subject = 'Your OTP for Password Reset';
    const text = `Your OTP is: ${otp}. It is valid for 1 hour.`;
    await sendEmail(email, subject, text);

    res.status(200).json({ message: 'OTP sent to your email.' });
  } catch (error) {
    console.error('Error in sending OTP:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  console.log('resetPassword endpoint hit'); // Log when the endpoint is accessed

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log('User  not found for email:', email); // Log if user is not found
      return res.status(404).json({ message: 'Email not found.' });
    }

    console.log('User  OTP from DB:', user.otp); // Log the OTP stored in the database
    console.log('Received OTP:', otp); // Log the OTP received from the request
    console.log('OTP Expiry:', user.otpExpire); // Log the OTP expiry time

    if (user.otp !== otp || user.otpExpire < Date.now()) {
      console.log('OTP validation failed.'); // Log if OTP validation fails
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = null; // Clear OTP after use
    user.otpExpire = null; // Clear OTP expiration
    await user.save();

    res.status(200).json({ message: 'Password has been reset successfully.' });
  } catch (error) {
    console.error('Error in resetting password:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

export const getSessionData = (req, res) => {
  if (req.session.user) {
    return res.status(200).json({ user: req.session.user });
  } else {
    return res.status(401).json({ message: 'No user logged in' });
  }
};