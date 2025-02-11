export const sessionMiddleware = (req, res, next) => {
  console.log('Session Data:', req.session); // Log the session data
  const { user, company, worker } = req.session;

  if (!user && !company && !worker) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  // Proceed to the next middleware or route handler
  next();
};