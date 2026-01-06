// src/models/reservation.model.js
const mongoose = require("mongoose");

const ReservationSchema = new mongoose.Schema(
  {
    reservationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    sku: {
      type: String,
      required: true,
      index: true,
    },

    userId: {
      type: String,
      required: true,
      index: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    status: {
      type: String,
      enum: ["RESERVED", "CONFIRMED", "CANCELLED", "EXPIRED"],
      default: "RESERVED",
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },

    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 🔥 MongoDB TTL index for auto-expiry of EXPIRED records only
ReservationSchema.index(
  { expiresAt: 1 },
  { expireAfterSeconds: 0, partialFilterExpression: { status: "EXPIRED" } }
);

const ReservationModel = mongoose.model("reservations", ReservationSchema);

module.exports = ReservationModel;
