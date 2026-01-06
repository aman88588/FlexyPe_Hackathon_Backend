const reservationService = require("../services/reservation.service");
const inventoryService = require("../services/inventory.service");
const { getIdempotencyKey } = require("../utils/idempotency.util");

/**
 * POST /inventory/reserve
 */
const reserveInventory = async (req, res) => {
  try {
    const { sku, userId, quantity } = req.body;

    // ✅ Use idempotency util
    const idempotencyKey = getIdempotencyKey(req);

    const reservation = await reservationService.reserveInventory({
      sku,
      userId,
      quantity,
      idempotencyKey,
    });

    return res.status(201).json({
      success: true,
      message: "Inventory reserved successfully",
      data: reservation,
    });
  } catch (error) {
    const status =
      error.statusCode ||
      (error.message?.toLowerCase().includes("available") ? 409 : 500);
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to reserve inventory",
    });
  }
};

/**
 * GET /inventory/:sku
 */
const getInventoryBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    const inventory = await inventoryService.getInventoryBySku(sku);

    return res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "Inventory not found",
    });
  }
};

module.exports = {
  reserveInventory,
  getInventoryBySku,
};
