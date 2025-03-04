import jwt from 'jsonwebtoken';

const adminMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    console.log("No token received."); 
    return res.status(401).json({ message: "No token, authorization denied." });
  }

  try {
    console.log("Token received:", token); 

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token:", decoded); // Debugging
    
    req.admin = await Admin.findById(decoded.id).select("-password");
    
    if (!req.admin) {
      console.log("Admin not found.");
      return res.status(401).json({ message: "Admin not found, authorization denied." });
    }

    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.status(401).json({ message: "Token is not valid." });
  }
};

export default adminMiddleware;
