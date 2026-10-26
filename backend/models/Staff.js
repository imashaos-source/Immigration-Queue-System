
const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    role: {
      type: String,
      enum: ["staff", "admin"],
      default: "staff",
    },
  },
  {
    timestamps: true,
  }
);

const Staff =
  mongoose.models.Staff ||
  mongoose.model("Staff", staffSchema);

module.exports = Staff;
