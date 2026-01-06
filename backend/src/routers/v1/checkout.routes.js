const express = require("express");
const router = express.Router();

const checkoutController = require("../../controllers/checkout.controller");

// POST /checkout/confirm
router.post("/confirm", checkoutController.confirmCheckout);

// POST /checkout/cancel
router.post("/cancel", checkoutController.cancelCheckout);

module.exports = router;
