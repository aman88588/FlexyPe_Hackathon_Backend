const mongoose = require("mongoose");
const ReservationModel = require("../models/reservation.model");
const inventoryRepo = require("../repositories/inventory.repository");

/**
 * Cleanup expired reservations and restore inventory.
 * Runs in small transactions per reservation to avoid double-counting stock.
 */
const cleanupExpiredReservations = async () => {
  const now = new Date();

  const expiredReservations = await ReservationModel.find({
    expiresAt: { $lte: now },
    status: "RESERVED",
  });

  for (const reservation of expiredReservations) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Ensure it is still RESERVED (could have been confirmed/cancelled concurrently)
      const lockedReservation = await ReservationModel.findOneAndUpdate(
        {
          reservationId: reservation.reservationId,
          status: "RESERVED",
        },
        { status: "EXPIRED" },
        { new: true, session }
      );

      if (!lockedReservation) {
        await session.abortTransaction();
        session.endSession();
        continue;
      }

      await inventoryRepo.increaseAvailableQuantity(
        lockedReservation.sku,
        lockedReservation.quantity,
        session
      );

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      console.error(
        `Failed to cleanup reservation ${reservation.reservationId}`,
        error.message
      );
    }
  }
};

/**
 * Periodically invoke cleanup to handle abandoned carts and restarts.
 * @param {number} intervalMs
 */
const scheduleExpiryCleanup = (intervalMs = 60_000) => {
  setInterval(() => {
    cleanupExpiredReservations().catch((error) =>
      console.error("Expiry cleanup failed", error.message)
    );
  }, intervalMs);
};

module.exports = {
  cleanupExpiredReservations,
  scheduleExpiryCleanup,
};
