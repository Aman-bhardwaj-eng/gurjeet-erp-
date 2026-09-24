const express = require("express");
const router = express.Router();

const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Stock = require("../models/Stock");
const Barcode = require("../models/Barcode");

router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Purchase Route Working"
    });
});

router.post("/", async (req, res) => {
    try {
        const {
            invoiceNo,
            purchaseDate,
            product,
            barcode,
            imei,
            serialNo,
            quantity,
            purchasePrice,
            gst,
            supplierName,
            supplierPhone,
            status
        } = req.body;

        if (!invoiceNo || !product) {
            return res.status(400).json({
                success: false,
                message: "Invoice number and product are required"
            });
        }

        if (!quantity || Number(quantity) < 1) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1"
            });
        }

        if (
            purchasePrice === undefined ||
            purchasePrice === ""
        ) {
            return res.status(400).json({
                success: false,
                message: "Purchase price is required"
            });
        }

        const productData = await Product.findById(product);

        if (!productData) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        const qty = Number(quantity);
        const price = Number(purchasePrice);
        const gstValue = Number(gst || 0);

        const subtotal = qty * price;
        const gstAmount = subtotal * gstValue / 100;
        const totalAmount = subtotal + gstAmount;

        const purchase = await Purchase.create({
            invoiceNo,
            purchaseDate: purchaseDate || new Date(),
            product,
            barcode,
            imei,
            serialNo,
            quantity: qty,
            purchasePrice: price,
            gst: gstValue,
            supplierName,
            supplierPhone,
            totalAmount,
            status: status || "received"
        });

        let stock = await Stock.findOne({
            product,
            barcode
        });

        if (stock) {
            stock.quantity += qty;
            stock.purchasePrice = price;
            stock.sellingPrice = productData.sellingPrice;
            stock.purchaseId = purchase._id;
            stock.status = "in_stock";

            if (imei) stock.imei = imei;
            if (serialNo) stock.serialNo = serialNo;

            await stock.save();

        } else {

            stock = await Stock.create({
                product,
                barcode: barcode || `AUTO-${Date.now()}`,
                imei,
                serialNo,
                purchaseId: purchase._id,
                purchasePrice: price,
                sellingPrice: productData.sellingPrice,
                quantity: qty,
                status: "in_stock"
            });
        }

        if (barcode) {
            await Barcode.findOneAndUpdate(
                { barcode },
                {
                    barcode,
                    imei,
                    serialNo,
                    product,
                    stock: stock._id,
                    type: imei
                        ? "imei"
                        : serialNo
                            ? "serial"
                            : "barcode",
                    status: "available"
                },
                {
                    upsert: true,
                    new: true
                }
            );
        }

        res.status(201).json({
            success: true,
            message: "Purchase created and stock updated successfully",
            purchase,
            stock
        });

    } catch (error) {
        console.error("Purchase Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const { search, status } = req.query;

        const filter = {};

        if (status) {
            filter.status = status;
        }

        if (search) {
            filter.$or = [
                {
                    invoiceNo: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    barcode: {
                        $regex: search,
                        $options: "i"
                    }
                },
                {
                    imei: {
                        $regex: search,
                        $options: "i"
                    }
                }
            ];
        }

        const purchases = await Purchase.find(filter)
            .populate({
                path: "product",
                populate: {
                    path: "brand",
                    select: "name"
                }
            })
            .sort({ purchaseDate: -1 });

        res.json({
            success: true,
            count: purchases.length,
            data: purchases
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

router.get("/:id", async (req, res) => {
    try {
        const purchase = await Purchase.findById(req.params.id)
            .populate("product");

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found"
            });
        }

        res.json({
            success: true,
            data: purchase
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

router.put("/:id", async (req, res) => {
    try {
        const purchase = await Purchase.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found"
            });
        }

        res.json({
            success: true,
            message: "Purchase updated successfully",
            data: purchase
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

router.delete("/:id", async (req, res) => {
    try {
        const purchase = await Purchase.findByIdAndDelete(
            req.params.id
        );

        if (!purchase) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found"
            });
        }

        res.json({
            success: true,
            message: "Purchase deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

module.exports = router;