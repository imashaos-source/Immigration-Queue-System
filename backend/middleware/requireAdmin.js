
function requireAdmin(req, res, next) {
  if (!req.staff || req.staff.role !== "admin") {
    return res.status(403).json({
      message: "Administrator permission required.",
    });
  }

  next();
}

module.exports = requireAdmin;
