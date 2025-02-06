export const sessionMiddleware = (req, res, next) => {
  // Check if any of the session types are present
  const { user, company, worker } = req.session;

  console.log('Session Data:', req.session); // Log the session data

  if (!user && !company && !worker) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  // Proceed to the next middleware or route handler
  next();
};