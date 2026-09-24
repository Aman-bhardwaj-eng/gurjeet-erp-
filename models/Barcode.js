const mongoose = require("mongoose");

const barcodeSchema = new mongoose.Schema(
    {
        barcode: {
            type: String,
            required: true,
            unique: true,
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

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        },

        stock: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Stock"
        },

        type: {
            type: String,
            enum: ["barcode", "imei", "serial"],
            default: "barcode"
        },

        status: {
            type: String,
            enum: [
                "available",
                "sold",
                "returned",
                "damaged"
            ],
            default: "available"
        }
    },
    {
        timestamps: true
    }
);

// Additional indexes
barcodeSchema.index({ imei: 1 });
barcodeSchema.index({ serialNo: 1 });

module.exports = mongoose.model("Barcode", barcodeSchema);