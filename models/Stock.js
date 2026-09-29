const mongoose = require("mongoose");

const stockSchema = new mongoose.Schema(
    {
        // Product Master reference
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },

        // Barcode optional
        barcode: {
            type: String,
            trim: true,
            default: undefined
        },

        // IMEI for mobile devices
        imei: {
            type: String,
            trim: true,
            sparse: true,
            unique: true,
            default: undefined,
            validate: {
                validator: function (value) {
                    return !value || /^\d{15}$/.test(value);
                },
                message: "IMEI must contain exactly 15 digits"
            }
        },

        // Optional serial number
        serialNo: {
            type: String,
            trim: true,
            default: undefined
        },

        // Purchase module removed
        purchasePrice: {
            type: Number,
            default: 0,
            min: 0
        },

        // Selling Price removed from UI
        // Default value will be 0
        sellingPrice: {
            type: Number,
            default: 0,
            min: 0
        },

        // Quantity
        quantity: {
            type: Number,
            default: 1,
            min: 0
        },

        // Stock status
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

        // Sale date
        soldDate: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

// Indexes
stockSchema.index({ barcode: 1 });
stockSchema.index({ serialNo: 1 });
stockSchema.index({ status: 1 });

module.exports = mongoose.model("Stock", stockSchema);