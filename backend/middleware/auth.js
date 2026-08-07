const jwt = require('jsonwebtoken');
const User = require('../models/User');



const protect = async (req, res, next) => {
  console.log("========== REQUEST HEADERS ==========");
  console.log(req.headers);

  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];

    console.log("Received Token:", token);

    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "super_secret_readpulse_jwt_key_2026_dev_mode"
      );

      console.log("Decoded:", decoded);

      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ["password"] },
      });

      console.log("User Found:", req.user);

      if (!req.user) {
        return res.status(401).json({
          message: "User no longer exists",
        });
      }

      return next();
    } catch (err) {
      console.error("JWT Error:", err.message);

      return res.status(401).json({
        message: "Not authorized, token failed",
      });
    }
  }

  console.log("Authorization header missing!");

  return res.status(401).json({
    message: "Not authorized, no token provided",
  });
};

module.exports = { protect, authorize };

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role '${req.user ? req.user.role : 'none'}' is not authorized to access this route` 
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
