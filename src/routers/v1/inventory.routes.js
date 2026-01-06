const express = require("express");
const router = express.Router();

const inventoryController = require("../../controllers/inventory.controller");

// POST /inventory/reserve
router.post("/reserve", inventoryController.reserveInventory);

// GET /inventory/:sku
router.get("/:sku", inventoryController.getInventoryBySku);

module.exports = router;
