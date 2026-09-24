const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
    {
        invoiceNo: {
            type: String,
            required: true,
            trim: true
        },

        purchaseDate: {
            type: Date,
            required: true,
            default: Date.now
        },

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        barcode: {
            type: String,
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

        quantity: {
            type: Number,
            required: true,
            min: 1
        },

        purchasePrice: {
            type: Number,
            required: true,
            min: 0
        },

        gst: {
            type: Number,
            default: 0,
            min: 0
        },

        supplierName: {
            type: String,
            trim: true
        },

        supplierPhone: {
            type: String,
            trim: true
        },

        totalAmount: {
            type: Number,
            default: 0,
            min: 0
        },

        status: {
            type: String,
            enum: ["received", "pending", "cancelled"],
            default: "received"
        }
    },
    {
        timestamps: true
    }
);

purchaseSchema.index({ invoiceNo: 1 });
purchaseSchema.index({ barcode: 1 });
purchaseSchema.index({ imei: 1 });
purchaseSchema.index({ serialNo: 1 });
purchaseSchema.index({ purchaseDate: -1 });

module.exports = mongoose.model("Purchase", purchaseSchema);