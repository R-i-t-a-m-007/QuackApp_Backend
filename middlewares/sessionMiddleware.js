export const sessionMiddleware = (req, res, next) => {
  if (!req.session.user && !req.session.company) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
  next();
};
