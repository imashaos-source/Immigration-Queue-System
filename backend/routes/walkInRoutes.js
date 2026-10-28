
const express = require("express");
const mongoose = require("mongoose");
const WalkInTicket = require("../models/WalkInTicket");
const Appointment = require("../models/Appointment");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

// Use Sri Lankan local dates so tickets reset according to Sri Lankan time.
function getQueueDate(dateValue = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(dateValue));

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
}

// Find the next available ticket number for a particular date.
// Example: W-001, W-002, W-003.
async function getNextWalkInTicketNumber(queueDate) {
  const tickets = await WalkInTicket.find({ queueDate })
    .select("ticketNumber")
    .lean();

  let highestNumber = 0;

  for (const ticket of tickets) {
    const match = /^W-(\d+)$/.exec(ticket.ticketNumber || "");

    if (match) {
      highestNumber = Math.max(
        highestNumber,
        Number.parseInt(match[1], 10)
      );
    }
  }

  return `W-${String(highestNumber + 1).padStart(3, "0")}`;
}

// PUBLIC: Combined live queue for today's walk-ins and appointments.
router.get("/board", async (req, res) => {
  try {
    const queueDate = getQueueDate();

    const walkInFilter = {
      queueDate,
      status: { $in: ["Waiting", "Serving"] },
    };

    if (req.query.office) {
      walkInFilter.office = req.query.office;
    }

    const walkInTickets = await WalkInTicket.find(walkInFilter)
      .sort({ createdAt: 1 })
      .lean();

    // Include approved appointments still in today's live queue.
    const appointmentFilter = {
      status: "Approved",
      queueDate,
      $or: [
        { queueStatus: { $in: ["Waiting", "Serving"] } },
        { queueStatus: { $exists: false } },
      ],
    };

    const appointments = await Appointment.find(appointmentFilter)
      .sort({ appointmentDate: 1, queueNumber: 1 })
      .select(
        "_id serviceType appointmentDate status queueNumber queueDate queueStatus"
      )
      .lean();

    // Do not expose applicants' names, email addresses, or passport numbers.
    const publicAppointments = appointments.map((appointment) => ({
      _id: `appointment-${appointment._id}`,
      type: "Appointment",
      ticketNumber: `A-${String(
        appointment.queueNumber ?? 0
      ).padStart(3, "0")}`,
      serviceType: appointment.serviceType,
      office: "Online Appointments",
      priority: "Normal",
      status: appointment.queueStatus || "Waiting",
      appointmentTime: appointment.appointmentDate,
      queueNumber: appointment.queueNumber,
      queueDate: appointment.queueDate,
    }));

    const publicWalkIns = walkInTickets.map((ticket) => ({
      _id: `walkin-${ticket._id}`,
      type: "WalkIn",
      ticketNumber: ticket.ticketNumber,
      serviceType: ticket.serviceType,
      office: ticket.office,
      priority: ticket.priority,
      status: ticket.status,
      createdAt: ticket.createdAt,
    }));

    // Show serving tickets first, followed by the waiting queue.
    const tickets = [
      ...publicWalkIns,
      ...publicAppointments,
    ].sort((a, b) => {
      if (a.status === "Serving" && b.status !== "Serving") {
        return -1;
      }

      if (b.status === "Serving" && a.status !== "Serving") {
        return 1;
      }

      if (
        a.type === "Appointment" &&
        b.type === "Appointment"
      ) {
        return (
          new Date(a.appointmentTime) -
          new Date(b.appointmentTime)
        );
      }

      if (a.type === "WalkIn" && b.type === "WalkIn") {
        return (
          new Date(a.createdAt) - new Date(b.createdAt)
        );
      }

      // Display appointments before walk-ins when types are mixed.
      if (a.type === "Appointment") return -1;
      if (b.type === "Appointment") return 1;

      return 0;
    });

    const now = new Date();

    const waitingAppointments = publicAppointments
      .filter(
        (appointment) => appointment.status === "Waiting"
      )
      .sort(
        (a, b) =>
          new Date(a.appointmentTime) -
          new Date(b.appointmentTime)
      );

    const nextAppointment =
      waitingAppointments.find(
        (appointment) =>
          new Date(appointment.appointmentTime) >= now
      ) || null;

    const overdueAppointments = waitingAppointments.filter(
      (appointment) =>
        new Date(appointment.appointmentTime) < now
    );

    res.json({
      date: queueDate,
      tickets,
      serving: tickets.filter(
        (ticket) => ticket.status === "Serving"
      ),
      waiting: tickets.filter(
        (ticket) => ticket.status === "Waiting"
      ),
      nextAppointment,
      overdueAppointments,
      serverTime: now.toISOString(),
    });
  } catch (error) {
    console.error(
      "Loading public combined queue:",
      error.message
    );

    res.status(500).json({
      message: "Could not load the live queue.",
    });
  }
});

// All routes below require staff authentication.
router.use(requireAuth);

// STAFF: Get today's walk-in tickets.
router.get("/", async (req, res) => {
  try {
    const queueDate = getQueueDate();

    const tickets = await WalkInTicket.find({ queueDate })
      .sort({ createdAt: 1 })
      .lean();

    res.json(tickets);
  } catch (error) {
    console.error(
      "Loading staff walk-in tickets:",
      error.message
    );

    res.status(500).json({
      message: "Could not load walk-in tickets.",
    });
  }
});

// STAFF: Register a walk-in visitor and issue a daily ticket.
router.post("/", async (req, res) => {
  try {
    const { applicantName, serviceType, office, priority } =
      req.body;

    if (
      typeof applicantName !== "string" ||
      !applicantName.trim() ||
      !serviceType ||
      typeof office !== "string" ||
      !office.trim()
    ) {
      return res.status(400).json({
        message:
          "Applicant name, service, and office are required.",
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

    const validPriorities = ["Normal", "Priority"];
    const selectedPriority = priority || "Normal";

    if (!validPriorities.includes(selectedPriority)) {
      return res.status(400).json({
        message: "Invalid priority.",
      });
    }

    if (
      !req.staff ||
      !mongoose.isValidObjectId(req.staff.id)
    ) {
      return res.status(401).json({
        message: "Valid staff authentication is required.",
      });
    }

    // Generate today's ticket number using Sri Lankan local date.
    const queueDate = getQueueDate();

    // Retry if a duplicate ticket number is rejected by the database.
    for (let attempt = 0; attempt < 5; attempt++) {
      const ticketNumber =
        await getNextWalkInTicketNumber(queueDate);

      try {
        const ticket = await WalkInTicket.create({
          applicantName: applicantName.trim(),
          serviceType,
          office: office.trim(),
          priority: selectedPriority,
          ticketNumber,
          queueDate,
          createdBy: new mongoose.Types.ObjectId(
            req.staff.id
          ),
        });

        return res.status(201).json({
          message: "Walk-in ticket registered successfully.",
          ticket,
        });
      } catch (error) {
        // Retry only for duplicate-key errors.
        // Other errors should be handled by the outer catch.
        if (error.code === 11000) {
          continue;
        }

        throw error;
      }
    }

    return res.status(409).json({
      message:
        "Could not issue a ticket. Please try registering again.",
    });
  } catch (error) {
    console.error(
      "Walk-in registration error:",
      error.message
    );

    res.status(500).json({
      message: "Could not register the walk-in visitor.",
    });
  }
});

// STAFF: Update a walk-in ticket's status.
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;

    const validStatuses = [
      "Waiting",
      "Serving",
      "Completed",
      "Cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid queue status.",
      });
    }

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({
        message: "Invalid ticket ID.",
      });
    }

    const ticket = await WalkInTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({
        message: "Ticket not found.",
      });
    }

    res.json({
      message: "Queue status updated.",
      ticket,
    });
  } catch (error) {
    console.error(
      "Updating walk-in status:",
      error.message
    );

    res.status(500).json({
      message: "Could not update the queue status.",
    });
  }
});

module.exports = router;
