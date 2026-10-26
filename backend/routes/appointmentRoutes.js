
const requireAdmin = require("../middleware/requireAdmin");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const requireAuth = require("../middleware/authMiddleware");

// Helper: Get the appointment date in Sri Lankan local time (YYYY-MM-DD)
function getQueueDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid appointment date");
  }

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// PUBLIC CREATE - Applicants can submit appointment requests without login
router.post("/", async (req, res) => {
  try {
    const {
      applicantName,
      email,
      passportNumber,
      serviceType,
      appointmentDate,
    } = req.body;

    if (
      typeof applicantName !== "string" ||
      !applicantName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof passportNumber !== "string" ||
      !passportNumber.trim() ||
      !serviceType ||
      !appointmentDate
    ) {
      return res.status(400).json({
        message: "Please provide all required appointment details.",
      });
    }

    const appointment = new Appointment({
      applicantName: applicantName.trim(),
      email: email.trim().toLowerCase(),
      passportNumber: passportNumber.trim().toUpperCase(),
      serviceType,
      appointmentDate,
    });

    const savedAppointment = await appointment.save();

    return res.status(201).json({
      message: "Appointment created successfully",
      appointment: savedAppointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "An appointment with this passport number or queue number already exists.",
      });
    }

    return res.status(400).json({
      message: "Failed to create appointment",
      error: error.message,
    });
  }
});

// All routes below this line require staff authentication.
router.use(requireAuth);

// READ - Get all appointments (staff only)
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      createdAt: -1,
    });

    return res.json(appointments);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve appointments",
    });
  }
});

// READ - Get one appointment by ID (staff only)
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    return res.json(appointment);
  } catch (error) {
    return res.status(500).json({
      message: "Failed to retrieve appointment",
    });
  }
});

// UPDATE - Edit an appointment and assign a daily queue number (staff only)
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const existingAppointment = await Appointment.findById(
      req.params.id
    );

    if (!existingAppointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    const updates = { ...req.body };

    // Prevent staff requests from directly setting queue fields.
    delete updates.queueNumber;
    delete updates.queueDate;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const requestedDate =
      updates.appointmentDate ?? existingAppointment.appointmentDate;

    const queueDate = getQueueDate(requestedDate);

    // Assign a queue number when an appointment is approved for the first time.
    if (
      updates.status === "Approved" &&
      existingAppointment.queueNumber == null
    ) {
      const lastQueuedAppointment = await Appointment.findOne({
        queueDate,
        queueNumber: { $ne: null },
      }).sort({ queueNumber: -1 });

      updates.queueDate = queueDate;
      updates.queueNumber =
        (lastQueuedAppointment?.queueNumber || 0) + 1;
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    return res.json({
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Queue number conflict. Please retry approving this appointment.",
      });
    }

    return res.status(400).json({
      message: "Failed to update appointment",
      error: error.message,
    });
  }
});

// DELETE - Remove an appointment (staff only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID",
      });
    }

    const appointment = await Appointment.findByIdAndDelete(
      req.params.id
    );

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found",
      });
    }

    return res.json({
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete appointment",
    });
  }
});

module.exports = router;
