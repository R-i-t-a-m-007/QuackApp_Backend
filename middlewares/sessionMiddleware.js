export const sessionMiddleware = (req, res, next) => {
  // Check if any of the session types are present
  const { user, company, worker } = req.session;

  if (!user && !company && !worker) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  // Optionally, you can log the type of session that is active
  // if (user) {
  //   console.log('User  session active:', user);
  // } else if (company) {
  //   console.log('Company session active:', company);
  // } else if (worker) {
  //   console.log('Worker session active:', worker);
  // }

  // Proceed to the next middleware or route handler
  next();
};