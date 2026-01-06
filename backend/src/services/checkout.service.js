const mongoose = require("mongoose");

const inventoryRepo = require("../repositories/inventory.repository");
const reservationRepo = require("../repositories/reservation.repository");

/**
 * CONFIRM CHECKOUT
 */
const confirmCheckout = async (reservationId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await reservationRepo.findByReservationId(
      reservationId,
      session
    );

    if (!reservation) {
      const error = new Error("Reservation not found");
      error.statusCode = 404;
      throw error;
    }

    if (reservation.status === "CONFIRMED") {
      await session.commitTransaction();
      session.endSession();
      return reservation;
    }

    if (reservation.status === "CANCELLED" || reservation.status === "EXPIRED") {
      const error = new Error("Reservation is no longer active");
      error.statusCode = 409;
      throw error;
    }

    // If the hold has expired but cleanup has not run yet, expire it and release inventory.
    if (reservation.expiresAt <= new Date()) {
      await inventoryRepo.increaseAvailableQuantity(
        reservation.sku,
        reservation.quantity,
        session
      );
      await reservationRepo.updateReservationStatus(
        reservationId,
        "EXPIRED",
        session
      );
      const error = new Error("Reservation expired");
      error.statusCode = 410;
      throw error;
    }

    const confirmedReservation = await reservationRepo.updateReservationStatus(
      reservationId,
      "CONFIRMED",
      session
    );

    await session.commitTransaction();
    session.endSession();

    return confirmedReservation;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

/**
 * CANCEL CHECKOUT
 */
const cancelCheckout = async (reservationId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const reservation = await reservationRepo.findByReservationId(
      reservationId,
      session
    );

    if (!reservation) {
      const error = new Error("Reservation not found");
      error.statusCode = 404;
      throw error;
    }

    if (reservation.status === "CANCELLED") {
      await session.commitTransaction();
      session.endSession();
      return reservation;
    }

    if (reservation.status === "CONFIRMED") {
      const error = new Error("Reservation already confirmed");
      error.statusCode = 409;
      throw error;
    }

    const isExpired = reservation.expiresAt <= new Date();

    // Restore inventory regardless of whether it expired or user cancelled.
    await inventoryRepo.increaseAvailableQuantity(
      reservation.sku,
      reservation.quantity,
      session
    );

    const updatedStatus = isExpired ? "EXPIRED" : "CANCELLED";
    const updatedReservation = await reservationRepo.updateReservationStatus(
      reservationId,
      updatedStatus,
      session
    );

    await session.commitTransaction();
    session.endSession();

    return updatedReservation;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

module.exports = {
  confirmCheckout,
  cancelCheckout,
};
