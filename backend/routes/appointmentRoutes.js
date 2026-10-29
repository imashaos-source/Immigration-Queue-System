
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Appointment = require("../models/Appointment");
const requireAuth = require("../middleware/authMiddleware");
const crypto = require("crypto");

// Get an appointment date in Sri Lankan local time (YYYY-MM-DD).
function getQueueDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid appointment date");
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
}

// PUBLIC: Applicants can submit appointment requests without login.
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
        // Validate the email address on the server.
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      return res.status(400).json({
        message: "Please provide a valid email address.",
      });
    }

    const validServices = [
      "Passport Services",
      "Visa Services",
      "Residence Permit",
      "Citizenship Services",
      "Other",
    ];

    if (!validServices.includes(serviceType)) {
      return res.status(400).json({
        message: "Invalid service type.",
      });
    }

    const parsedAppointmentDate = new Date(appointmentDate);

    if (Number.isNaN(parsedAppointmentDate.getTime())) {
      return res.status(400).json({
        message: "Please provide a valid appointment date and time.",
      });
    }

    const bookingReference = `IMM-${new Date().getFullYear()}-${crypto
      .randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;

    const appointment = new Appointment({
      applicantName: applicantName.trim(),
      email: email.trim().toLowerCase(),
      passportNumber: passportNumber.trim().toUpperCase(),
      serviceType,
      appointmentDate: parsedAppointmentDate,
      bookingReference,
    });

    const savedAppointment = await appointment.save();

    return res.status(201).json({
      message: "Appointment created successfully.",
      appointment: savedAppointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "An appointment with this passport number or booking reference already exists.",
      });
    }

    console.error("Appointment creation error:", error.message);

    return res.status(400).json({
      message: "Failed to create appointment.",
      error: error.message,
    });
  }
});

// PUBLIC: Check appointment status using booking reference and email.
router.post("/check-status", async (req, res) => {
  try {
    const { bookingReference, email } = req.body;

    if (
      typeof bookingReference !== "string" ||
      !bookingReference.trim() ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        message: "Please provide your booking reference and email address.",
      });
    }

    const appointment = await Appointment.findOne({
      bookingReference: bookingReference.trim().toUpperCase(),
      email: email.trim().toLowerCase(),
    }).select(
      "bookingReference applicantName serviceType appointmentDate status queueNumber queueDate"
    );

    if (!appointment) {
      return res.status(404).json({
        message:
          "No appointment was found with those details. Please check your reference and email address.",
      });
    }

    return res.json({
      message: "Appointment found successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Appointment status check error:", error.message);

    return res.status(500).json({
      message: "Unable to check appointment status. Please try again.",
    });
  }
});

// All routes below this line require staff authentication.
router.use(requireAuth);

// STAFF: Get all appointments.
router.get("/", async (req, res) => {
  try {
    const appointments = await Appointment.find().sort({
      createdAt: -1,
    });

    return res.json(appointments);
  } catch (error) {
    console.error("Loading appointments:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve appointments.",
    });
  }
});

// STAFF: Get one appointment by ID.
router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID.",
      });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    return res.json(appointment);
  } catch (error) {
    console.error("Retrieving appointment:", error.message);

    return res.status(500).json({
      message: "Failed to retrieve appointment.",
    });
  }
});

// STAFF: Update appointment details, approval status, and queue status.
router.put("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID.",
      });
    }

    const existingAppointment = await Appointment.findById(
      req.params.id
    );

    if (!existingAppointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    const updates = { ...req.body };

    // These fields are controlled by the backend.
    delete updates.queueNumber;
    delete updates.queueDate;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const validQueueStatuses = [
      "Waiting",
      "Serving",
      "Completed",
    ];

    if (
      updates.queueStatus !== undefined &&
      !validQueueStatuses.includes(updates.queueStatus)
    ) {
      return res.status(400).json({
        message: "Invalid appointment queue status.",
      });
    }

    // A queue status can only be changed for an approved appointment.
    const resultingAppointmentStatus =
      updates.status ?? existingAppointment.status;

    if (
      updates.queueStatus !== undefined &&
      resultingAppointmentStatus !== "Approved" &&
      !(updates.queueStatus === "Completed" &&
        resultingAppointmentStatus === "Completed")
    ) {
      return res.status(400).json({
        message: "Only approved appointments can enter the service queue.",
      });
    }

    // Keep booking status and live queue status coordinated.
    if (updates.status === "Cancelled") {
      updates.queueStatus = "Waiting";
    }

    if (updates.status === "Completed") {
      updates.queueStatus = "Completed";
    }

    if (updates.queueStatus === "Completed") {
      updates.status = "Completed";
    }

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
      updates.queueStatus = "Waiting";
    }

    // Keep the queue date consistent if an appointment date changes
    // before the appointment has been approved.
    if (
      updates.appointmentDate !== undefined &&
      existingAppointment.queueNumber == null
    ) {
      updates.queueDate = null;
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
      message: "Appointment updated successfully.",
      appointment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message:
          "Queue number conflict. Please retry approving this appointment.",
      });
    }

    console.error("Appointment update error:", error.message);

    return res.status(400).json({
      message: "Failed to update appointment.",
      error: error.message,
    });
  }
});

// ADMIN: Delete an appointment.
router.delete("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid appointment ID.",
      });
    }

    const appointment = await Appointment.findByIdAndDelete(
      req.params.id
    );

    if (!appointment) {
      return res.status(404).json({
        message: "Appointment not found.",
      });
    }

    return res.json({
      message: "Appointment deleted successfully.",
    });
  } catch (error) {
    console.error("Deleting appointment:", error.message);

    return res.status(500).json({
      message: "Failed to delete appointment.",
    });
  }
});

module.exports = router;
