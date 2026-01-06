const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const inventoryRepo = require("../repositories/inventory.repository");
const reservationRepo = require("../repositories/reservation.repository");
const { acquireLock, releaseLock } = require("../utils/lock.util");

const RESERVATION_TTL_MINUTES = 5;

/**
 * Reserve inventory when user begins checkout
 */
const reserveInventory = async ({
  sku,
  userId,
  quantity = 1,
  idempotencyKey,
}) => {
  if (!sku || !userId || !idempotencyKey) {
    const error = new Error("sku, userId and idempotencyKey are required");
    error.statusCode = 400;
    throw error;
  }

  const parsedQuantity = Number(quantity);
  if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
    const error = new Error("quantity must be a positive integer");
    error.statusCode = 400;
    throw error;
  }

  // 🔒 Acquire lock per SKU (prevents race condition at app level)
  await acquireLock(sku);

  try {
    // 1️⃣ Idempotency check (user refresh / retry safe)
    const existingReservation =
      await reservationRepo.findByIdempotencyKey(idempotencyKey);

    if (existingReservation) {
      return existingReservation;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 2️⃣ Atomically decrease inventory (DB-level safety)
      const inventory = await inventoryRepo.decreaseAvailableQuantity(
        sku,
        parsedQuantity,
        session
      );

      if (!inventory) {
        const error = new Error("Inventory not available");
        error.statusCode = 409;
        throw error;
      }

      // 3️⃣ Create reservation with expiry
      const expiresAt = new Date(
        Date.now() + RESERVATION_TTL_MINUTES * 60 * 1000
      );

      const reservation = await reservationRepo.createReservation(
        {
          reservationId: uuidv4(),
          sku,
          userId,
          quantity: parsedQuantity,
          expiresAt,
          idempotencyKey,
        },
        session
      );

      await session.commitTransaction();
      session.endSession();

      return reservation;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  } finally {
    // 🔓 Always release lock (VERY IMPORTANT)
    releaseLock(sku);
  }
};

module.exports = {
  reserveInventory,
};
