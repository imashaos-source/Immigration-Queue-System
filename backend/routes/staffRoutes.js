
const express = require("express");
const bcrypt = require("bcryptjs");
const Staff = require("../models/Staff");
const requireAuth = require("../middleware/authMiddleware");
const requireAdmin = require("../middleware/requireAdmin");

const router = express.Router();

// Every route in this file requires an authenticated administrator.
router.use(requireAuth, requireAdmin);

// Create a staff account.
router.post("/", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 12
    ) {
      return res.status(400).json({
        message: "Provide a name, email, and password of at least 12 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingStaff = await Staff.findOne({ email: normalizedEmail });

    if (existingStaff) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const staff = await Staff.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "staff",
    });

    return res.status(201).json({
      message: "Staff account created successfully.",
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    console.error("Staff creation error:", error.message);

    return res.status(500).json({
      message: "Unable to create the staff account.",
    });
  }
});

// List staff accounts without exposing password hashes.
router.get("/", async (req, res) => {
  try {
    const staffMembers = await Staff.find()
      .select("name email role createdAt")
      .sort({ createdAt: -1 });

    return res.json({ staff: staffMembers });
  } catch (error) {
    console.error("Staff listing error:", error.message);

    return res.status(500).json({
      message: "Unable to retrieve staff accounts.",
    });
  }
});

module.exports = router;
