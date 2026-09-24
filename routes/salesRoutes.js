const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");

const Sale = require("../models/Sale");
const Stock = require("../models/Stock");
const SoldProduct = require("../models/SoldProduct");

// =====================================================
// TEST ROUTE
// =====================================================

router.get("/test", (req, res) => {

    res.json({
        success: true,
        message: "Sales Route Working"
    });

});


// =====================================================
// GET ALL SALES
// =====================================================

router.get("/", async (req, res) => {

    try {

        const {
            search,
            date,
            soldBy,
            status
        } = req.query;


        const filter = {};


        // -------------------------------------------------
        // SEARCH BARCODE / IMEI / SERIAL / INVOICE
        // -------------------------------------------------

        if (search) {

            filter.$or = [

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
                },

                {
                    serialNo: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    invoiceNo: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    customerName: {
                        $regex: search,
                        $options: "i"
                    }
                },

                {
                    customerPhone: {
                        $regex: search,
                        $options: "i"
                    }
                }

            ];

        }


        // -------------------------------------------------
        // DATE FILTER
        // -------------------------------------------------

        if (date) {

            const startDate =
                new Date(date);

            startDate.setHours(
                0,
                0,
                0,
                0
            );


            const endDate =
                new Date(date);

            endDate.setHours(
                23,
                59,
                59,
                999
            );


            filter.saleDate = {

                $gte: startDate,

                $lte: endDate

            };

        }


        // -------------------------------------------------
        // SOLD BY
        // -------------------------------------------------

        if (
            soldBy &&
            mongoose.Types.ObjectId.isValid(soldBy)
        ) {

            filter.soldBy = soldBy;

        }


        // -------------------------------------------------
        // STATUS
        // -------------------------------------------------

        if (status) {

            filter.status = status;

        }


        // -------------------------------------------------
        // GET SALES
        // -------------------------------------------------

        const sales =
            await Sale.find(filter)

                .populate(
                    "product"
                )

                .populate(
                    "stockId"
                )

                .populate(
                    "soldBy",
                    "name email"
                )

                .sort({
                    saleDate: -1
                });


        res.json({

            success: true,

            count: sales.length,

            data: sales

        });

    }

    catch (error) {

        console.error(
            "Get Sales Error:",
            error
        );


        res.status(500).json({

            success: false,

            message: "Server error",

            error: error.message

        });

    }

});


// =====================================================
// GET SINGLE SALE
// =====================================================

router.get("/:id", async (req, res) => {

    try {

        const sale =
            await Sale.findById(
                req.params.id
            )

                .populate("product")

                .populate("stockId")

                .populate(
                    "soldBy",
                    "name email"
                );


        if (!sale) {

            return res.status(404).json({

                success: false,

                message: "Sale not found"

            });

        }


        res.json({

            success: true,

            data: sale

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: "Server error",

            error: error.message

        });

    }

});


// =====================================================
// MANUAL SELL
// =====================================================

router.post("/sell", async (req, res) => {

    try {

        const {

            stockId,

            invoiceNo,

            sellingPrice,

            quantity,

            customerName,

            customerPhone,

            paymentMethod,

            soldBy

        } = req.body;


        // -------------------------------------------------
        // VALIDATION
        // -------------------------------------------------

        if (!stockId) {

            return res.status(400).json({

                success: false,

                message: "Stock ID is required"

            });

        }


        if (!invoiceNo) {

            return res.status(400).json({

                success: false,

                message: "Invoice number is required"

            });

        }


        if (
            sellingPrice === undefined ||
            sellingPrice === null
        ) {

            return res.status(400).json({

                success: false,

                message: "Selling price is required"

            });

        }


        // -------------------------------------------------
        // FIND STOCK
        // -------------------------------------------------

        const stock =
            await Stock.findById(
                stockId
            );


        if (!stock) {

            return res.status(404).json({

                success: false,

                message: "Stock item not found"

            });

        }


        // -------------------------------------------------
        // CHECK STOCK STATUS
        // -------------------------------------------------

        if (
            stock.status &&
            stock.status !== "in_stock"
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `This stock cannot be sold. Current status: ${stock.status}`

            });

        }


        // -------------------------------------------------
        // QUANTITY
        // -------------------------------------------------

        const saleQuantity =
            Number(quantity || 1);


        if (
            !Number.isInteger(saleQuantity) ||
            saleQuantity < 1
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Quantity must be a valid positive number"

            });

        }


        // -------------------------------------------------
        // CHECK AVAILABLE QUANTITY
        // -------------------------------------------------

        const availableQuantity =
            Number(
                stock.quantity || 0
            );


        if (
            availableQuantity <
            saleQuantity
        ) {

            return res.status(400).json({

                success: false,

                message:
                    `Only ${availableQuantity} item(s) available in stock`

            });

        }


        // -------------------------------------------------
        // PRICE
        // -------------------------------------------------

        const price =
            Number(
                sellingPrice
            );


        if (
            Number.isNaN(price) ||
            price < 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Invalid selling price"

            });

        }


        const totalAmount =
            price *
            saleQuantity;


        // -------------------------------------------------
        // CREATE SALE
        // -------------------------------------------------

        const sale =
            new Sale({

                stockId:
                    stock._id,

                product:
                    stock.product,

                barcode:
                    stock.barcode,

                imei:
                    stock.imei,

                serialNo:
                    stock.serialNo,

                invoiceNo:
                    invoiceNo.trim(),

                quantity:
                    saleQuantity,

                sellingPrice:
                    price,

                totalAmount:
                    totalAmount,

                customerName:
                    customerName
                    ? customerName.trim()
                    : undefined,

                customerPhone:
                    customerPhone
                    ? customerPhone.trim()
                    : undefined,

                paymentMethod:
                    paymentMethod ||
                    "cash",

                soldBy:
                    soldBy || undefined,

                status:
                    "completed"

            });


        const savedSale =
            await sale.save();


        // -------------------------------------------------
        // UPDATE STOCK
        // -------------------------------------------------

        const remainingQuantity =
            availableQuantity -
            saleQuantity;


        stock.quantity =
            remainingQuantity;


        // If no stock remains, mark sold.
        // Otherwise keep it in stock.

        if (
            remainingQuantity <= 0
        ) {

            stock.quantity = 0;

            stock.status = "sold";

        }

        else {

            stock.status =
                "in_stock";

        }


        await stock.save();


        // -------------------------------------------------
        // CREATE SOLD PRODUCT RECORD
        // -------------------------------------------------

        const soldProduct =
            new SoldProduct({

                stockId:
                    stock._id,

                product:
                    stock.product,

                barcode:
                    stock.barcode,

                imei:
                    stock.imei,

                serialNo:
                    stock.serialNo,

                soldDate:
                    savedSale.saleDate,

                soldBy:
                    soldBy || undefined,

                sellingPrice:
                    price,

                customerName:
                    customerName
                    ? customerName.trim()
                    : undefined,

                customerPhone:
                    customerPhone
                    ? customerPhone.trim()
                    : undefined,

                invoiceNo:
                    invoiceNo.trim(),

                paymentMethod:
                    paymentMethod ||
                    "cash",

                status:
                    "sold"

            });


        await soldProduct.save();


        // -------------------------------------------------
        // RESPONSE
        // -------------------------------------------------

        res.status(201).json({

            success: true,

            message:
                "Product sold successfully",

            data: {

                sale:
                    savedSale,

                stock:
                    stock,

                soldProduct:
                    soldProduct

            }

        });

    }

    catch (error) {

        console.error(
            "Manual Sale Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to sell product",

            error:
                error.message

        });

    }

});


// =====================================================
// RETURN SALE
// =====================================================

router.put(
    "/:id/return",
    async (req, res) => {

        try {

            const sale =
                await Sale.findById(
                    req.params.id
                );


            if (!sale) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Sale not found"

                });

            }


            if (
                sale.status ===
                "returned"
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Sale already returned"

                });

            }


            const stock =
                await Stock.findById(
                    sale.stockId
                );


            if (!stock) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Original stock not found"

                });

            }


            // Restore quantity

            stock.quantity =
                Number(
                    stock.quantity || 0
                ) +
                Number(
                    sale.quantity || 1
                );


            stock.status =
                "in_stock";


            await stock.save();


            // Update sale

            sale.status =
                "returned";


            await sale.save();


            // Update sold product

            await SoldProduct.findOneAndUpdate(

                {
                    invoiceNo:
                        sale.invoiceNo,

                    stockId:
                        sale.stockId

                },

                {
                    status:
                        "returned"

                }

            );


            res.json({

                success: true,

                message:
                    "Sale returned successfully",

                data: sale

            });

        }

        catch (error) {

            console.error(
                "Return Sale Error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Failed to return sale",

                error:
                    error.message

            });

        }

    }
);


// =====================================================
// DELETE SALE
// =====================================================

router.delete("/:id", async (req, res) => {

    try {

        const sale =
            await Sale.findById(
                req.params.id
            );


        if (!sale) {

            return res.status(404).json({

                success: false,

                message:
                    "Sale not found"

            });

        }


        // Restore stock before deleting sale

        const stock =
            await Stock.findById(
                sale.stockId
            );


        if (stock) {

            stock.quantity =
                Number(
                    stock.quantity || 0
                ) +
                Number(
                    sale.quantity || 1
                );


            stock.status =
                "in_stock";


            await stock.save();

        }


        // Delete sale

        await Sale.findByIdAndDelete(
            req.params.id
        );


        // Delete sold product record

        await SoldProduct.deleteMany({

            invoiceNo:
                sale.invoiceNo,

            stockId:
                sale.stockId

        });


        res.json({

            success: true,

            message:
                "Sale deleted and stock restored"

        });

    }

    catch (error) {

        console.error(
            "Delete Sale Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to delete sale",

            error:
                error.message

        });

    }

});


module.exports = router;