const mongoose = require("mongoose");

const queueCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    sequenceValue: {
      type: Number,
      required: true,
      default: 0
    }
  },
  {
    versionKey: false
  }
);

module.exports = mongoose.model(
  "QueueCounter",
  queueCounterSchema
);