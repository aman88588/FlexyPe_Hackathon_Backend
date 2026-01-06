const InventoryModel = require("../models/inventory.model");

/**
 * Find inventory by SKU
 */
const findBySku = async (sku) => {
  return InventoryModel.findOne({ sku });
};

/**
 * Atomically decrease available quantity
 * This prevents overselling under concurrency
 */
const decreaseAvailableQuantity = async (sku, quantity, session = null) => {
  return InventoryModel.findOneAndUpdate(
    {
      sku,
      availableQuantity: { $gte: quantity }, // IMPORTANT safeguard
    },
    {
      $inc: { availableQuantity: -quantity },
    },
    {
      new: true,
      session,
    }
  );
};

/**
 * Increase available quantity (used on cancel / expiry)
 */
const increaseAvailableQuantity = async (sku, quantity, session = null) => {
  return InventoryModel.findOneAndUpdate(
    { sku },
    {
      $inc: { availableQuantity: quantity },
    },
    {
      new: true,
      session,
    }
  );
};

module.exports = {
  findBySku,
  decreaseAvailableQuantity,
  increaseAvailableQuantity,
};
