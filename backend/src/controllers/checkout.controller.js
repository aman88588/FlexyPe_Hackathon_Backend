const checkoutService = require("../services/checkout.service");

/**
 * POST /checkout/confirm
 */
const confirmCheckout = async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: "reservationId is required",
      });
    }

    const reservation = await checkoutService.confirmCheckout(reservationId);

    return res.status(200).json({
      success: true,
      message: "Checkout confirmed successfully",
      data: reservation,
    });
  } catch (error) {
    const status =
      error.statusCode ||
      (error.message?.toLowerCase().includes("not found") ? 404 : 500);
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to confirm checkout",
    });
  }
};

/**
 * POST /checkout/cancel
 */
const cancelCheckout = async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({
        success: false,
        message: "reservationId is required",
      });
    }

    const reservation = await checkoutService.cancelCheckout(reservationId);

    return res.status(200).json({
      success: true,
      message: "Checkout cancelled successfully",
      data: reservation,
    });
  } catch (error) {
    const status =
      error.statusCode ||
      (error.message?.toLowerCase().includes("not found") ? 404 : 500);
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to cancel checkout",
    });
  }
};

module.exports = {
  confirmCheckout,
  cancelCheckout,
};
