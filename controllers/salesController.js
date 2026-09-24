const mongoose = require("mongoose");

const Sale = require("../models/Sale");
const Stock = require("../models/Stock");
const SoldProduct = require("../models/SoldProduct");

// =====================================================
// TEST
// =====================================================

exports.test = (req, res) => {
    res.json({
        success: true,
        message: "Sales Route Working"
    });
};


// =====================================================
// GET ALL SALES
// =====================================================

exports.getSales = async (req, res) => {
    try {
        const {
            search,
            date,
            soldBy,
            status
        } = req.query;

        const filter = {};

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

        if (date) {
            const startDate =
                new Date(date);

            startDate.setHours(
                0, 0, 0, 0
            );

            const endDate =
                new Date(date);

            endDate.setHours(
                23, 59, 59, 999
            );

            filter.saleDate = {
                $gte: startDate,
                $lte: endDate
            };
        }

        if (
            soldBy &&
            mongoose.isValidObjectId(
                soldBy
            )
        ) {
            filter.soldBy = soldBy;
        }

        if (status) {
            filter.status = status;
        }

        const sales =
            await Sale.find(filter)
                .populate("product")
                .populate("stockId")
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

    } catch (error) {
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
};


// =====================================================
// CREATE SALE
// =====================================================

exports.createSale = async (req, res) => {
    try {
        const {
            stockId,
            imei,
            barcode,
            invoiceNo,
            quantity,
            sellingPrice,
            customerName,
            customerPhone,
            paymentMethod,
            soldBy
        } = req.body;

        if (!invoiceNo) {
            return res.status(400).json({
                success: false,
                message:
                    "Invoice number is required"
            });
        }

        if (
            !stockId &&
            !imei &&
            !barcode
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Stock ID or IMEI is required"
            });
        }

        let stock;

        if (stockId) {
            if (
                !mongoose.isValidObjectId(
                    stockId
                )
            ) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Invalid stock ID"
                });
            }

            stock =
                await Stock.findById(
                    stockId
                );
        } else if (imei) {
            stock =
                await Stock.findOne({
                    imei: imei.trim()
                });
        } else {
            stock =
                await Stock.findOne({
                    barcode:
                        barcode.trim()
                });
        }

        if (!stock) {
            return res.status(404).json({
                success: false,
                message:
                    "Product not found in stock"
            });
        }

        if (
            stock.status === "sold" ||
            Number(stock.quantity || 0) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "This product is already sold"
            });
        }

        const saleQuantity =
            Number(quantity || 1);

        if (
            !Number.isInteger(
                saleQuantity
            ) ||
            saleQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Quantity must be a valid positive number"
            });
        }

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

        const price =
            Number(sellingPrice);

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

        const allowedPayments = [
            "cash",
            "upi",
            "card",
            "bank_transfer",
            "other"
        ];

        const finalPayment =
            paymentMethod || "cash";

        if (
            !allowedPayments.includes(
                finalPayment
            )
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Invalid payment method"
            });
        }

        const totalAmount =
            price * saleQuantity;

        const sale =
            await Sale.create({
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
                    finalPayment,
                soldBy:
                    soldBy || undefined,
                status:
                    "completed"
            });

        stock.quantity =
            availableQuantity -
            saleQuantity;

        if (
            stock.quantity <= 0
        ) {
            stock.quantity = 0;
            stock.status = "sold";
            stock.soldDate = new Date();
        } else {
            stock.status = "in_stock";
        }

        await stock.save();

        const soldProduct =
            await SoldProduct.create({
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
                    sale.saleDate,
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
                    finalPayment,
                status:
                    "sold"
            });

        res.status(201).json({
            success: true,
            message:
                "Product sold successfully",
            data: {
                sale,
                stock,
                soldProduct
            }
        });

    } catch (error) {
        console.error(
            "Create Sale Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to sell product",
            error: error.message
        });
    }
};


// =====================================================
// GET SINGLE SALE
// =====================================================

exports.getSale = async (req, res) => {
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

    } catch (error) {
        console.error(
            "Get Sale Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
};


// =====================================================
// RETURN SALE
// =====================================================

exports.returnSale = async (req, res) => {
    try {
        const sale =
            await Sale.findById(
                req.params.id
            );

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found"
            });
        }

        if (
            sale.status === "returned"
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

        stock.quantity =
            Number(stock.quantity || 0) +
            Number(sale.quantity || 1);

        stock.status =
            "in_stock";

        await stock.save();

        sale.status =
            "returned";

        await sale.save();

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

    } catch (error) {
        console.error(
            "Return Sale Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to return sale",
            error: error.message
        });
    }
};


// =====================================================
// DELETE SALE
// =====================================================

exports.deleteSale = async (req, res) => {
    try {
        const sale =
            await Sale.findById(
                req.params.id
            );

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: "Sale not found"
            });
        }

        const stock =
            await Stock.findById(
                sale.stockId
            );

        if (stock) {
            stock.quantity =
                Number(stock.quantity || 0) +
                Number(sale.quantity || 1);

            stock.status =
                "in_stock";

            await stock.save();
        }

        await Sale.findByIdAndDelete(
            req.params.id
        );

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

    } catch (error) {
        console.error(
            "Delete Sale Error:",
            error
        );

        res.status(500).json({
            success: false,
            message:
                "Failed to delete sale",
            error: error.message
        });
    }
};