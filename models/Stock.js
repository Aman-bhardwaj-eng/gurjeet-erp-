const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        barcode: {
            type: String,
            required: true,
            trim: true
        },

        imei: {
            type: String,
            trim: true
        },

        serialNo: {
            type: String,
            trim: true
        },

        purchaseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Purchase"
        },

        purchasePrice: {
            type: Number,
            required: true,
            min: 0
        },

        sellingPrice: {
            type: Number,
            required: true,
            min: 0
        },

        quantity: {
            type: Number,
            default: 1,
            min: 0
        },

        status: {
            type: String,
            enum: [
                "in_stock",
                "sold",
                "reserved",
                "damaged",
                "returned"
            ],
            default: "in_stock"
        },

        soldDate: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);

stockSchema.index({ barcode: 1 });
stockSchema.index({ imei: 1 });
stockSchema.index({ serialNo: 1 });
stockSchema.index({ status: 1 });

module.exports = mongoose.model("Stock", stockSchema);