import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Company from '../models/Company.js';
import Individual from '../models/Individual.js';


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

