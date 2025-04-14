import User from '../models/User.js';
import Worker from '../models/Worker.js';
import CompanyList from '../models/CompanyList.js';
import { Expo } from 'expo-server-sdk'; // Optional: for validating the push token format

// Utility function to validate Expo Push Token
const isValidExpoPushToken = (token) => {
  return Expo.isExpoPushToken(token);
};

// Save Expo push token for a user
export const saveUserPushToken = async (req, res) => {
  const { userId, token } = req.body;

  if (!userId || !token) {
    return res.status(400).json({ message: 'Missing user ID or token.' });
  }

  // Validate the push token format
  if (!isValidExpoPushToken(token)) {
    return res.status(400).json({ message: 'Invalid push token format.' });
  }

  try {
    const user = await User.findByIdAndUpdate(userId, { expoPushToken: token }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json({ message: 'User push token saved.' });
  } catch (err) {
    console.error('Error saving user push token:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Save Expo push token for a worker
export const saveWorkerPushToken = async (req, res) => {
  const { workerId, token } = req.body;

  if (!workerId || !token) {
    return res.status(400).json({ message: 'Missing worker ID or token.' });
  }

  // Validate the push token format
  if (!isValidExpoPushToken(token)) {
    return res.status(400).json({ message: 'Invalid push token format.' });
  }

  try {
    const worker = await Worker.findByIdAndUpdate(workerId, { expoPushToken: token }, { new: true });
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found.' });
    }
    res.json({ message: 'Worker push token saved.' });
  } catch (err) {
    console.error('Error saving worker push token:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Save Expo push token for a company
export const saveCompanyPushToken = async (req, res) => {
  const { companyId, token } = req.body;

  if (!companyId || !token) {
    return res.status(400).json({ message: 'Missing company ID or token.' });
  }

  // Validate the push token format
  if (!isValidExpoPushToken(token)) {
    return res.status(400).json({ message: 'Invalid push token format.' });
  }

  try {
    const company = await CompanyList.findByIdAndUpdate(companyId, { expoPushToken: token }, { new: true });
    if (!company) {
      return res.status(404).json({ message: 'Company not found.' });
    }
    res.json({ message: 'Company push token saved.' });
  } catch (err) {
    console.error('Error saving company push token:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};
