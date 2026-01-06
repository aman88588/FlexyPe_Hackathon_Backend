const express = require("express");
const router = express.Router();

const inventoryRoutes = require("./inventory.routes");
const checkoutRoutes = require("./checkout.routes");
const adminRoutes = require("./admin.routes");


// Route grouping
router.use("/inventory", inventoryRoutes);
router.use("/checkout", checkoutRoutes);
router.use("/admin", adminRoutes);


module.exports = router;
