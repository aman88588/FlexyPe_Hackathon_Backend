const InventoryModel = require("../models/inventory.model");

/**
 * Find inventory by SKU
 */
const findBySku = async (sku) => {
  return InventoryModel.findOne({ sku });
};

/**
 * Create new inventory item
 */
const createInventory = async (data) => {
  const inventory = new InventoryModel(data);
  return inventory.save();
};

/**
 * Update inventory
 */
const updateInventory = async (sku, updates) => {
  return InventoryModel.findOneAndUpdate({ sku }, updates, { new: true });
};

/**
 * Delete inventory
 */
const deleteInventory = async (sku) => {
  return InventoryModel.findOneAndDelete({ sku });
};

/**
 * Get all inventory with pagination
 */
const getAllInventory = async ({ page = 1, limit = 50, sortBy = "sku" }) => {
  const skip = (page - 1) * limit;

  const [items, totalItems] = await Promise.all([
    InventoryModel.find().sort({ [sortBy]: 1 }).skip(skip).limit(limit),
    InventoryModel.countDocuments(),
  ]);

  return {
    items,
    totalItems,
    totalPages: Math.ceil(totalItems / limit),
  };
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
  createInventory,
  updateInventory,
  deleteInventory,
  getAllInventory,
  decreaseAvailableQuantity,
  increaseAvailableQuantity,
};