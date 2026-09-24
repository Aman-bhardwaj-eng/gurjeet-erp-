const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
    {
        stockId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Stock",
            required: true
        },

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

        invoiceNo: {
            type: String,
            required: true,
            trim: true
        },

        saleDate: {
            type: Date,
            default: Date.now
        },

        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },

        sellingPrice: {
            type: Number,
            required: true,
            min: 0
        },

        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },

        customerName: {
            type: String,
            trim: true
        },

        customerPhone: {
            type: String,
            trim: true
        },

        paymentMethod: {
            type: String,
            enum: [
                "cash",
                "upi",
                "card",
                "bank_transfer",
                "other"
            ],
            default: "cash"
        },

        soldBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        status: {
            type: String,
            enum: [
                "completed",
                "returned",
                "cancelled"
            ],
            default: "completed"
        }
    },
    {
        timestamps: true
    }
);

// Indexes
saleSchema.index({ barcode: 1 });
saleSchema.index({ imei: 1 });
saleSchema.index({ serialNo: 1 });
saleSchema.index({ invoiceNo: 1 });
saleSchema.index({ saleDate: -1 });

module.exports = mongoose.model("Sale", saleSchema);