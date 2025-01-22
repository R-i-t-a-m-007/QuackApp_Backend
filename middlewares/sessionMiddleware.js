export const sessionMiddleware = (req, res, next) => {
  const { user, company, worker } = req.session;

  if (!user && !company && !worker) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }

  if (user) {
    console.log('User  session active:', user);
  } else if (company) {
    console.log('Company session active:', company);
  } else if (worker) {
    console.log('Worker session active:', worker);
  }

  next();
};