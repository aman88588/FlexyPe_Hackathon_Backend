// src/models/inventory.model.js
const mongoose = require("mongoose");

const InventorySchema = new mongoose.Schema(
  {
    sku: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    productName: {
      type: String,
      required: true,
      trim: true,
    },

    totalQuantity: {
      type: Number,
      required: true,
      min: 0,
    },

    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const InventoryModel = mongoose.model("inventory", InventorySchema);

module.exports = InventoryModel;
