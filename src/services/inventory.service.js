const inventoryRepo = require("../repositories/inventory.repository");

const getInventoryBySku = async (sku) => {
  const inventory = await inventoryRepo.findBySku(sku);

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  return {
    sku: inventory.sku,
    productName: inventory.productName,
    availableQuantity: inventory.availableQuantity,
  };
};

module.exports = {
  getInventoryBySku,
};
