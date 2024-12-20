import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';
import Individual from '../models/Individual.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';


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

export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the email exists in either collection
    const user = await Individual.findOne({ email }) || await Company.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    // Send email with the current password
    const subject = 'Your Password Request';
    const text = `Your current password is: ${user.password}\nPlease keep it secure and change it after logging in.`;
    await sendEmail(email, subject, text);

    res.status(200).json({ message: 'Your current password has been sent to your email.' });
  } catch (error) {
    console.error('Error in forgot password:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};


export const registerUser = async (req, res) => {
  const { username, email, phone, address, postcode, password, userType } = req.body;

  try {
    // Check if username or email already exists
    const existingUsername = await Individual.findOne({ username }) || await Company.findOne({ username });
    const existingEmail = await Individual.findOne({ email }) || await Company.findOne({ email });

    if (existingUsername) {
      return res.status(400).json({ message: 'Username already exists.' });
    }

    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user based on userType
    if (userType === 'individual') {
      const newUser = new Individual({
        username,
        email,
        phone,
        address,
        postcode,
        password: hashedPassword,
      });
      await newUser.save();
      return res.status(200).json({ message: 'Registration successful' });
    } else if (userType === 'company') {
      // Handle company registration (Agency under construction message)
      return res.status(400).json({ message: 'Agency under construction. Please try registering as an individual.' });
    } else {
      return res.status(400).json({ message: 'Invalid user type selected.' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Registration failed. Please try again later.' });
  }
};


export const loginUser = async (req, res) => {
  const { username, password, userType } = req.body;

  try {
    let user;
    if (userType === 'company') {
      user = await Company.findOne({ username });
    } else if (userType === 'individual') {
      user = await Individual.findOne({ username });
    } else {
      return res.status(400).json({ message: 'Invalid user type.' });
    }

    if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

    // Set session
    req.session.user = { id: user._id, username: user.username, userType };

    // Generate JWT
    const payload = { id: user._id, username: user.username, userType };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, message: 'Login successful!', user: req.session.user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const logoutUser = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ message: 'Error logging out.' });
    }
    res.clearCookie('connect.sid');  // Clear the session cookie
    res.status(200).json({ message: 'Logout successful.' });
  });
};


export const getLoggedInUser = async (req, res) => {
  try {
    // Use req.session.user.id instead of req.session.userId
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ message: 'No user logged in' });
    }

    const user = await (req.session.user.userType === 'company' 
      ? Company 
      : Individual
    ).findById(req.session.user.id).select('-password');  // Exclude password

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getSessionData = (req, res) => {
  if (req.session.user) {
    res.json(req.session.user);
  } else {
    res.status(401).json({ message: 'No active session.' });
  }
};

export const requestOtp = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await Individual.findOne({ email }) || await Company.findOne({ email });

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

export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    const user = await Individual.findOne({ email }) || await Company.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    // Check if OTP is valid
    if (user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // Hash the new password
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
