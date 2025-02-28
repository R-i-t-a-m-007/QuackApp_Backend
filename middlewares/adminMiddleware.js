import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

const adminMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from Bearer
  if (!token) return res.status(401).json({ message: 'No token, authorization denied.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get the admin's details from the database (excluding password)
    req.admin = await Admin.findById(decoded.id).select('-password');

    if (!req.admin) {
      return res.status(401).json({ message: 'Admin not found, authorization denied.' });
    }

    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid.' });
  }
};

export default adminMiddleware;
