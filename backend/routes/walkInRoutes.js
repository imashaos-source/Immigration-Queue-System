
const express = require("express");
const mongoose = require("mongoose");
const WalkInTicket = require("../models/WalkInTicket");
const requireAuth = require("../middleware/authMiddleware");

const router = express.Router();

function getQueueDate() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};
  parts.forEach((part) => {
    if (part.type !== "literal") values[part.type] = part.value;
  });

  return `${values.year}-${values.month}-${values.day}`;
}

// Public: get the live queue, optionally filtered by office.
router.get("/board", async (req, res) => {
  try {
    const filter = {
      queueDate: getQueueDate(),
      status: { $in: ["Waiting", "Serving"] },
    };

    if (req.query.office) {
      filter.office = req.query.office;
    }

    const tickets = await WalkInTicket.find(filter)
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      date: getQueueDate(),
      tickets,
      serving: tickets.filter((ticket) => ticket.status === "Serving"),
      waiting: tickets.filter((ticket) => ticket.status === "Waiting"),
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load the live queue." });
  }
});

// All routes below require staff authentication.
router.use(requireAuth);

router.get("/", async (req, res) => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const values = Object.fromEntries(
      parts
        .filter((part) => part.type !== "literal")
        .map((part) => [part.type, part.value])
    );

    const queueDate =
      `${values.year}-${values.month}-${values.day}`;

    const tickets = await WalkInTicket.find({ queueDate })
      .sort({ createdAt: 1 })
      .lean();

    res.json(tickets);
  } catch (error) {
    console.error("Loading staff walk-in tickets:", error.message);
    res.status(500).json({
      message: "Could not load walk-in tickets.",
    });
  }
});

// Staff: register a walk-in visitor and issue a ticket.
router.post("/", async (req, res) => {
  try {
    const { applicantName, serviceType, office, priority } = req.body;

    if (
      !applicantName?.trim() ||
      !serviceType ||
      !office?.trim()
    ) {
      return res.status(400).json({
        message: "Applicant name, service, and office are required.",
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
      return res.status(400).json({ message: "Invalid service type." });
    }

    const validPriorities = ["Normal", "Priority"];
    const selectedPriority = priority || "Normal";

    if (!validPriorities.includes(selectedPriority)) {
      return res.status(400).json({ message: "Invalid priority." });
    }

    const queueDate = getQueueDate();

    // Retry if two staff members request the same next ticket simultaneously.
    for (let attempt = 0; attempt < 5; attempt++) {
      const count = await WalkInTicket.countDocuments({ queueDate });
      const ticketNumber = `W-${String(count + 1).padStart(3, "0")}`;

      try {
        const ticket = await WalkInTicket.create({
          applicantName: applicantName.trim(),
          serviceType,
          office: office.trim(),
          priority: selectedPriority,
          ticketNumber,
          queueDate,
          createdBy: new mongoose.Types.ObjectId(req.staff.id),
        });

        return res.status(201).json({
          message: "Walk-in ticket registered successfully.",
          ticket,
        });
      } catch (error) {
        if (error.code !== 11000) throw error;
      }
    }

    return res.status(409).json({
      message: "Could not issue a ticket. Please try again.",
    });
  } catch (error) {
    console.error("Walk-in registration error:", error.message);
    res.status(500).json({ message: "Could not register the walk-in visitor." });
  }
});

// Staff: update a ticket's queue status.
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Waiting", "Serving", "Completed", "Cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid queue status." });
    }

    const ticket = await WalkInTicket.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found." });
    }

    res.json({ message: "Queue status updated.", ticket });
  } catch (error) {
    res.status(500).json({ message: "Could not update the queue status." });
  }
});

module.exports = router;
