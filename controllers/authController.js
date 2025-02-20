import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import nodemailer from 'nodemailer';

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

// Function to generate a random user code
const generateUserCode = () => {
  const randomNum = Math.floor(1000 + Math.random() * 9000); // Generate a random number between 1000 and 9999
  return `USER${randomNum}`; // Format the user code
};

// Register User
export const registerUser  = async (req, res) => {
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

    // Generate user code
    const userCode = generateUserCode();

    // Create new user
    const newUser  = new User({
      username,
      email,
      phone,
      address,
      postcode,
      password: hashedPassword,
      userCode, // Include userCode
    });

    await newUser .save();

    // Set session for the newly registered user
    req.session.user = { id: newUser ._id, username: newUser .username };

    // Send a welcome email
    const subject = 'Successful Registration';
    const text = `Dear ${username},

Thank you for registering. We are thrilled to have you as part of our community.
    
Your account credentials are:
- Username: ${username}
- Password: ${password}
- User Code: ${userCode}

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
export const loginUser  = async (req, res) => {
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
    req.session.user = { id: user._id, username: user.username,userCode: user.userCode };

    // Generate JWT
    const payload = { id: user._id, username: user.username,userCode: user.userCode };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, message: 'Login successful!', user: req.session.user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Logout User
export const logoutUser  = (req, res) => {
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
export const getLoggedInUser  = async (req, res) => {
  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ message: 'No user logged in' });
    }

    const user = await User.findById(req.session.user.id).select('-password'); // Exclude password

    if (!user) {
      return res.status(404).json({ message: 'User  not found' });
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

    // Set the price based on the package
    if (packageName === 'Basic') {
      user.price = 14.95;
    } else if (packageName === 'Pro') {
      user.price = 29.95;
    }

    await user.save();

    res.status(200).json({ message: 'Package selection saved successfully.' });
  } catch (error) {
    console.error('Error saving package:', error);
    res.status(500).json({ message: 'Failed to save package.' });
  }
};

// Request OTP for Password Reset
export const requestOtp  = async (req, res) => {
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
export const resetPassword  = async (req, res) => {
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

export const getSessionData  = (req, res) => {
  if (req.session.user) {
    return res.status(200).json({ user: req.session.user });
  } else {
    return res.status(401).json({ message: 'No user logged in' });
  }
};

// Update User Package
export const updateUserPackage = async (req, res) => {
  const { newPackage } = req.body;

  try {
    if (!req.session.user || !req.session.user.id) {
      return res.status(401).json({ message: 'No user logged in' });
    }

    const user = await User.findById(req.session.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Allow upgrade only from Basic to Pro
    if (user.package === 'Basic' && newPackage === 'Pro') {
      user.package = newPackage;
      user.price = 29.95; // Update price for Pro package
      await user.save();

      return res.status(200).json({ message: 'Package updated successfully.', user });
    } else {
      return res.status(400).json({ message: 'Package update is only allowed from Basic to Pro.' });
    }
  } catch (error) {
    console.error('Error updating package:', error);
    res.status(500).json({ message: 'Failed to update package.' });
  }
};

// Function to upload user image
export const uploadUserImage = async (req, res) => {
  const { userId } = req.params; // Get userId from request parameters

  try {
    // Ensure the user is logged in
    if (!req.session.user || req.session.user.id !== userId) {
      return res.status(401).json({ message: 'Unauthorized access.' });
    }

    // Check if an image was uploaded
    if (!req.body.image) {
      return res.status(400).json({ message: 'No image provided.' });
    }

    // Update user with the image (base64 string)
    const updatedUser  = await User.findByIdAndUpdate(
      userId,
      { image: req.body.image }, // Store the base64 image
      { new: true }
    );

    if (!updatedUser ) {
      return res.status(404).json({ message: 'User  not found.' });
    }

    res.status(200).json({ message: 'Image uploaded successfully.', user: updatedUser  });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password -otp -otpExpire'); // Exclude sensitive fields

    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

export const updateUserDetails = async (req, res) => {
  const { userId } = req.params;
  const { username, email, phone, address, postcode } = req.body;
  console.log("Received userId:", userId); 
  
  try {
    // Find the user by their ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's details with the correct field names
    user.username = username || user.username;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.address = address || user.address;
    user.postcode = postcode || user.postcode;

    await user.save(); // Save the updated user

    return res.status(200).json({ message: 'User details updated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  const { userId } = req.params; // Get userId from request parameters

  try {
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
};

export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const getTotalPrice = async (req, res) => {
  try {
    const total = await User.aggregate([
      { $group: { _id: null, totalPrice: { $sum: "$price" } } }
    ]);

    res.status(200).json({ totalPrice: total[0]?.totalPrice || 0 });
  } catch (error) {
    console.error('Error calculating total price:', error);
    res.status(500).json({ message: 'Failed to calculate total price.' });
  }
};