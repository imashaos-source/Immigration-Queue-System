
const mongoose = require("mongoose");

const walkInTicketSchema = new mongoose.Schema(
  {
    applicantName: {
      type: String,
      required: true,
      trim: true,
    },

    serviceType: {
      type: String,
      required: true,
      enum: [
        "Passport Services",
        "Visa Services",
        "Residence Permit",
        "Citizenship Services",
        "Other",
      ],
    },

    office: {
      type: String,
      required: true,
      trim: true,
    },

    priority: {
      type: String,
      enum: ["Normal", "Priority"],
      default: "Normal",
    },

    ticketNumber: {
      type: String,
      required: true,
    },

    queueDate: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      enum: ["Waiting", "Serving", "Completed", "Cancelled"],
      default: "Waiting",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
  },
  { timestamps: true }
);

walkInTicketSchema.index(
  { queueDate: 1, ticketNumber: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.WalkInTicket ||
  mongoose.model("WalkInTicket", walkInTicketSchema);
