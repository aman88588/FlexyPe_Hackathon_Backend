const ReservationModel = require("../models/reservation.model");

/**
 * Find reservation by idempotency key
 * Used to prevent duplicate reserve requests
 */
const findByIdempotencyKey = async (idempotencyKey, session = null) => {
  const query = ReservationModel.findOne({ idempotencyKey });
  return session ? query.session(session) : query;
};

/**
 * Create a new reservation
 */
const createReservation = async (data, session = null) => {
  const reservation = new ReservationModel(data);
  return reservation.save({ session });
};

/**
 * Find reservation by reservationId
 */
const findByReservationId = async (reservationId, session = null) => {
  const query = ReservationModel.findOne({ reservationId });
  return session ? query.session(session) : query;
};

/**
 * Update reservation status
 */
const updateReservationStatus = async (
  reservationId,
  status,
  session = null
) => {
  return ReservationModel.findOneAndUpdate(
    { reservationId },
    { status },
    { new: true, session }
  );
};

/**
 * Find active reservations for cleanup / safety checks
 * Excludes already expired holds.
 */
const findActiveReservation = async (reservationId, session = null) => {
  const query = ReservationModel.findOne({
    reservationId,
    status: "RESERVED",
    expiresAt: { $gt: new Date() },
  });
  return session ? query.session(session) : query;
};

module.exports = {
  findByIdempotencyKey,
  createReservation,
  findByReservationId,
  updateReservationStatus,
  findActiveReservation,
};
