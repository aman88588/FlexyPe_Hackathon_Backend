const express = require("express");
const router = express.Router();

const inventoryRoutes = require("./inventory.routes");
const checkoutRoutes = require("./checkout.routes");

// Route grouping
router.use("/inventory", inventoryRoutes);
router.use("/checkout", checkoutRoutes);

module.exports = router;
