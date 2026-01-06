const express = require("express");
const router = express.Router();

const adminController = require("../../controllers/admin.controller");

// POST /admin/inventory - Create single inventory item
router.post("/inventory", adminController.createInventory);

// POST /admin/inventory/bulk - Create multiple inventory items
router.post("/inventory/bulk", adminController.createBulkInventory);

// GET /admin/inventory/all - Get all inventory items
router.get("/inventory/all", adminController.getAllInventory);

// PUT /admin/inventory/:sku - Update inventory item
router.put("/inventory/:sku", adminController.updateInventory);

// DELETE /admin/inventory/:sku - Delete inventory item
router.delete("/inventory/:sku", adminController.deleteInventory);

module.exports = router;