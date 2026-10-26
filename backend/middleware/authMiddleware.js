
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authentication required. Please log in.",
    });
  }

  const token = authHeader.slice(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.sub || !["staff", "admin"].includes(decoded.role)) {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    req.staff = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Your session is invalid or has expired. Please log in again.",
    });
  }
}

module.exports = requireAuth;
