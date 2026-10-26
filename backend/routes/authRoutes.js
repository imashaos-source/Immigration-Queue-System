
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Staff = require("../models/Staff");

const router = express.Router();

// Create the first administrator
router.post("/setup-admin", async (req, res) => {
  try {
    const { name, email, password, setupSecret } = req.body;

    if (!process.env.SETUP_SECRET || !process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication secrets are not configured on the server.",
      });
    }

    if (setupSecret !== process.env.SETUP_SECRET) {
      return res.status(403).json({
        message: "Invalid setup secret.",
      });
    }

    const existingAdmin = await Staff.findOne({ role: "admin" });

    if (existingAdmin) {
      return res.status(409).json({
        message: "An administrator has already been created.",
      });
    }

    if (
      !name?.trim() ||
      !email?.trim() ||
      typeof password !== "string" ||
      password.length < 12
    ) {
      return res.status(400).json({
        message:
          "Provide a name, email, and a password containing at least 12 characters.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await Staff.findOne({ email: normalizedEmail });

    if (existingEmail) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await Staff.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: "admin",
    });

    return res.status(201).json({
      message: "Administrator created successfully.",
      staff: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin setup error:", error.message);
    return res.status(500).json({
      message: "Unable to create the administrator.",
    });
  }
});

// Staff login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "Authentication is not configured on the server.",
      });
    }

    const staff = await Staff.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    if (!staff || !(await bcrypt.compare(password, staff.passwordHash))) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        sub: staff._id.toString(),
        role: staff.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      message: "Login successful.",
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        email: staff.email,
        role: staff.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({
      message: "Unable to log in.",
    });
  }
});

module.exports = router;
