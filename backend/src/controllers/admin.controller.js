const inventoryService = require("../services/inventory.service");

/**
 * POST /admin/inventory
 * Create or update inventory item
 */
const createInventory = async (req, res) => {
  try {
    const { sku, productName, totalQuantity, availableQuantity } = req.body;

    // Validation
    if (!sku || !productName || totalQuantity === undefined) {
      return res.status(400).json({
        success: false,
        message: "sku, productName, and totalQuantity are required",
      });
    }

    const inventory = await inventoryService.createInventory({
      sku,
      productName,
      totalQuantity,
      availableQuantity:
        availableQuantity !== undefined ? availableQuantity : totalQuantity,
    });

    return res.status(201).json({
      success: true,
      message: "Inventory created successfully",
      data: inventory,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to create inventory",
    });
  }
};

/**
 * POST /admin/inventory/bulk
 * Create multiple inventory items at once
 */
const createBulkInventory = async (req, res) => {
  try {
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "items array is required and must not be empty",
      });
    }

    const results = await inventoryService.createBulkInventory(items);

    return res.status(201).json({
      success: true,
      message: `Bulk inventory created: ${results.success} succeeded, ${results.failed} failed`,
      data: results,
    });
  } catch (error) {
    const status = error.statusCode || 500;
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to create bulk inventory",
    });
  }
};

/**
 * PUT /admin/inventory/:sku
 * Update inventory quantities
 */
const updateInventory = async (req, res) => {
  try {
    const { sku } = req.params;
    const { totalQuantity, availableQuantity, productName } = req.body;

    if (
      totalQuantity === undefined &&
      availableQuantity === undefined &&
      !productName
    ) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field (totalQuantity, availableQuantity, productName) is required",
      });
    }

    const inventory = await inventoryService.updateInventory(sku, {
      totalQuantity,
      availableQuantity,
      productName,
    });

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully",
      data: inventory,
    });
  } catch (error) {
    const status =
      error.statusCode ||
      (error.message?.toLowerCase().includes("not found") ? 404 : 500);
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to update inventory",
    });
  }
};

/**
 * DELETE /admin/inventory/:sku
 * Delete inventory item
 */
const deleteInventory = async (req, res) => {
  try {
    const { sku } = req.params;

    await inventoryService.deleteInventory(sku);

    return res.status(200).json({
      success: true,
      message: "Inventory deleted successfully",
    });
  } catch (error) {
    const status =
      error.statusCode ||
      (error.message?.toLowerCase().includes("not found") ? 404 : 500);
    return res.status(status).json({
      success: false,
      message: error.message || "Unable to delete inventory",
    });
  }
};

/**
 * GET /admin/inventory/all
 * Get all inventory items
 */
const getAllInventory = async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = "sku" } = req.query;

    const result = await inventoryService.getAllInventory({
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to fetch inventory",
    });
  }
};

module.exports = {
  createInventory,
  createBulkInventory,
  updateInventory,
  deleteInventory,
  getAllInventory,
};