
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");

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
    day: "2-digit"
  }).format(date);
}

// CREATE - Add a new appointment
router.post("/", async (req, res) => {
  try {
    const appointment = new Appointment(req.body);
    const savedAppointment = await appointment.save();

    res.status(201).json({
      message: "Appointment created successfully",
      appointment: savedAppointment
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create appointment",
      error: error.message
    });
  }
});

// READ - Get all appointments
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      createdAt: -1
    });

    res.json(appointments);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve appointments",
      error: error.message
    });
  }
});

// READ - Get one appointment by ID
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID"
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    res.json(appointment);
  } catch (error) {
    res.status(400).json({
      message: "Failed to retrieve appointment",
      error: error.message
    });
  }
});

// UPDATE - Edit an appointment and assign a daily queue number
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID"
      });
    }

    const existingAppointment = await Appointment.findById(
      req.params.id
    );

    if (!existingAppointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    const updates = { ...req.body };

    // Prevent clients from directly choosing their own queue number.
    delete updates.queueNumber;
    delete updates.queueDate;

    const requestedDate =
      updates.appointmentDate ?? existingAppointment.appointmentDate;

    const queueDate = getQueueDate(requestedDate);

    // Assign a queue number when an appointment is approved
    // for the first time.
    if (
      updates.status === "Approved" &&
      existingAppointment.queueNumber == null
    ) {
      // Find the highest queue number for this appointment date.
      const lastQueuedAppointment = await Appointment.findOne({
        queueDate,
        queueNumber: { $ne: null }
      }).sort({ queueNumber: -1 });

      updates.queueDate = queueDate;
      updates.queueNumber =
        (lastQueuedAppointment?.queueNumber || 0) + 1;
    }

    // Keep existing queue information if an already-approved
    // appointment is edited. Date changes do not automatically
    // move an existing queue number to another date.
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updates,
      {
        returnDocument: "after",
        runValidators: true
      }
    );

    res.json({
      message: "Appointment updated successfully",
      appointment
    });
  } catch (error) {
    // A duplicate queue number can occur if approvals overlap.
    // Return a useful error rather than reporting success.
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Queue number conflict. Please retry approving this appointment."
      });
    }

    res.status(400).json({
      message: "Failed to update appointment",
      error: error.message
    });
  }
});

// DELETE - Remove an appointment
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID"
      });
    }

    const appointment = await Appointment.findByIdAndDelete(
      req.params.id
    );

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found"
      });
    }

    res.json({
      message: "Appointment deleted successfully"
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete appointment",
      error: error.message
    });
  }
});

// Export the router
module.exports = router;
