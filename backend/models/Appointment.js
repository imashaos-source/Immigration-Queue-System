
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    applicantName: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    passportNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true
    },

    bookingReference: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },

    serviceType: {
      type: String,
      required: true,
      enum: [
        "Passport Services",
        "Visa Services",
        "Residence Permit",
        "Citizenship Services",
        "Other"
      ]
    },

    appointmentDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Completed", "Cancelled"],
      default: "Pending"
    },

    queueNumber: {
      type: Number,
      default: null
    },

    queueDate: {
      type: String,
      default: null
    }
  },
  { timestamps: true }
);

appointmentSchema.index(
  { queueDate: 1, queueNumber: 1 },
  {
    unique: true,
    partialFilterExpression: {
      queueDate: { $type: "string" },
      queueNumber: { $type: "number" }
    }
  }
);

const Appointment =
  mongoose.models.Appointment ||
  mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
