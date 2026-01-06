const inventoryRepo = require("../repositories/inventory.repository");

/**
 * Get inventory by SKU
 */
const getInventoryBySku = async (sku) => {
  const inventory = await inventoryRepo.findBySku(sku);

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  return {
    sku: inventory.sku,
    productName: inventory.productName,
    totalQuantity: inventory.totalQuantity,
    availableQuantity: inventory.availableQuantity,
  };
};

/**
 * Create new inventory item
 */
const createInventory = async ({
  sku,
  productName,
  totalQuantity,
  availableQuantity,
}) => {
  // Check if SKU already exists
  const existing = await inventoryRepo.findBySku(sku);
  if (existing) {
    const error = new Error(`Inventory with SKU ${sku} already exists`);
    error.statusCode = 409;
    throw error;
  }

  // Validate quantities
  if (totalQuantity < 0 || availableQuantity < 0) {
    const error = new Error("Quantities cannot be negative");
    error.statusCode = 400;
    throw error;
  }

  if (availableQuantity > totalQuantity) {
    const error = new Error(
      "Available quantity cannot exceed total quantity"
    );
    error.statusCode = 400;
    throw error;
  }

  const inventory = await inventoryRepo.createInventory({
    sku,
    productName,
    totalQuantity,
    availableQuantity,
  });

  return {
    sku: inventory.sku,
    productName: inventory.productName,
    totalQuantity: inventory.totalQuantity,
    availableQuantity: inventory.availableQuantity,
  };
};

/**
 * Create multiple inventory items
 */
const createBulkInventory = async (items) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
    created: [],
  };

  for (const item of items) {
    try {
      const inventory = await createInventory(item);
      results.created.push(inventory);
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        sku: item.sku,
        error: error.message,
      });
    }
  }

  return results;
};

/**
 * Update inventory
 */
const updateInventory = async (sku, updates) => {
  const inventory = await inventoryRepo.findBySku(sku);

  if (!inventory) {
    const error = new Error(`Inventory with SKU ${sku} not found`);
    error.statusCode = 404;
    throw error;
  }

  // Validate if quantities are provided
  if (updates.totalQuantity !== undefined && updates.totalQuantity < 0) {
    const error = new Error("Total quantity cannot be negative");
    error.statusCode = 400;
    throw error;
  }

  if (
    updates.availableQuantity !== undefined &&
    updates.availableQuantity < 0
  ) {
    const error = new Error("Available quantity cannot be negative");
    error.statusCode = 400;
    throw error;
  }

  // Check consistency
  const newTotal =
    updates.totalQuantity !== undefined
      ? updates.totalQuantity
      : inventory.totalQuantity;
  const newAvailable =
    updates.availableQuantity !== undefined
      ? updates.availableQuantity
      : inventory.availableQuantity;

  if (newAvailable > newTotal) {
    const error = new Error(
      "Available quantity cannot exceed total quantity"
    );
    error.statusCode = 400;
    throw error;
  }

  const updated = await inventoryRepo.updateInventory(sku, updates);

  return {
    sku: updated.sku,
    productName: updated.productName,
    totalQuantity: updated.totalQuantity,
    availableQuantity: updated.availableQuantity,
  };
};

/**
 * Delete inventory
 */
const deleteInventory = async (sku) => {
  const inventory = await inventoryRepo.findBySku(sku);

  if (!inventory) {
    const error = new Error(`Inventory with SKU ${sku} not found`);
    error.statusCode = 404;
    throw error;
  }

  await inventoryRepo.deleteInventory(sku);

  return { message: "Inventory deleted successfully" };
};

/**
 * Get all inventory with pagination
 */
const getAllInventory = async ({ page = 1, limit = 50, sortBy = "sku" }) => {
  const result = await inventoryRepo.getAllInventory({
    page,
    limit,
    sortBy,
  });

  return {
    items: result.items.map((inv) => ({
      sku: inv.sku,
      productName: inv.productName,
      totalQuantity: inv.totalQuantity,
      availableQuantity: inv.availableQuantity,
    })),
    pagination: {
      currentPage: page,
      totalPages: result.totalPages,
      totalItems: result.totalItems,
      itemsPerPage: limit,
    },
  };
};

module.exports = {
  getInventoryBySku,
  createInventory,
  createBulkInventory,
  updateInventory,
  deleteInventory,
  getAllInventory,
};