const Product = require("../models/Product");
const Brand = require("../models/Brand");
const Stock = require("../models/Stock");
const Purchase = require("../models/Purchase");
const SoldProduct = require("../models/SoldProduct");

// =====================================================
// GET DASHBOARD DATA
// =====================================================

exports.getDashboard = async (req, res) => {
    try {

        // =================================================
        // TOTAL PRODUCTS
        // =================================================

        const totalProducts =
            await Product.countDocuments();


        // =================================================
        // TOTAL BRANDS
        // =================================================

        const totalBrands =
            await Brand.countDocuments();


        // =================================================
        // TOTAL STOCK
        // =================================================

        const stockResult =
            await Stock.aggregate([
                {
                    $match: {
                        status: "in_stock"
                    }
                },
                {
                    $group: {
                        _id: null,
                        total: {
                            $sum: "$quantity"
                        }
                    }
                }
            ]);


        const totalStock =
            stockResult.length > 0
                ? stockResult[0].total
                : 0;


        // =================================================
        // LOW STOCK
        // Quantity 1 to 5
        // =================================================

        const lowStock =
            await Stock.countDocuments({
                quantity: {
                    $gt: 0,
                    $lte: 5
                },
                status: "in_stock"
            });


        // =================================================
        // OUT OF STOCK
        // =================================================

        const outStock =
            await Stock.countDocuments({
                $or: [
                    {
                        quantity: 0
                    },
                    {
                        status: "sold"
                    }
                ]
            });


        // =================================================
        // RECENT PRODUCTS
        // Last 7 Days
        // =================================================

        const sevenDaysAgo =
            new Date();

        sevenDaysAgo.setDate(
            sevenDaysAgo.getDate() - 7
        );


        const recentProduct =
            await Product.countDocuments({
                createdAt: {
                    $gte: sevenDaysAgo
                }
            });


        // =================================================
        // TOP SELLING BRAND
        // =================================================

        const topBrandResult =
            await SoldProduct.aggregate([

                {
                    $lookup: {
                        from: "products",
                        localField: "product",
                        foreignField: "_id",
                        as: "productData"
                    }
                },

                {
                    $unwind: "$productData"
                },

                {
                    $lookup: {
                        from: "brands",
                        localField: "productData.brand",
                        foreignField: "_id",
                        as: "brandData"
                    }
                },

                {
                    $unwind: "$brandData"
                },

                {
                    $group: {
                        _id: "$brandData._id",
                        name: {
                            $first: "$brandData.name"
                        },
                        totalSold: {
                            $sum: 1
                        }
                    }
                },

                {
                    $sort: {
                        totalSold: -1
                    }
                },

                {
                    $limit: 1
                }

            ]);


        const topBrand =
            topBrandResult.length > 0
                ? topBrandResult[0].name
                : "-";


        // =================================================
        // BRAND WISE STOCK
        // =================================================

        const brandWiseStock =
            await Stock.aggregate([

                {
                    $match: {
                        status: "in_stock"
                    }
                },

                {
                    $lookup: {
                        from: "products",
                        localField: "product",
                        foreignField: "_id",
                        as: "productData"
                    }
                },

                {
                    $unwind: "$productData"
                },

                {
                    $lookup: {
                        from: "brands",
                        localField: "productData.brand",
                        foreignField: "_id",
                        as: "brandData"
                    }
                },

                {
                    $unwind: "$brandData"
                },

                {
                    $group: {
                        _id: "$brandData.name",
                        quantity: {
                            $sum: "$quantity"
                        }
                    }
                },

                {
                    $sort: {
                        quantity: -1
                    }
                }

            ]);


        // =================================================
        // PURCHASE VS SOLD
        // =================================================

        const totalPurchases =
            await Purchase.countDocuments();


        const totalSold =
            await SoldProduct.countDocuments();


        // =================================================
        // RECENT ACTIVITY
        // =================================================

        const recentProducts =
            await Product.find()
                .sort({
                    createdAt: -1
                })
                .limit(5);


        const recentSales =
            await SoldProduct.find()
                .sort({
                    soldDate: -1
                })
                .limit(5)
                .populate({
                    path: "product",
                    select: "productName model"
                });


        const activities = [];


        recentProducts.forEach(
            product => {

                activities.push({
                    date: product.createdAt,
                    user: "Admin",
                    action:
                        `Product added: ${product.productName || "Product"}`
                });

            }
        );


        recentSales.forEach(
            sale => {

                activities.push({
                    date:
                        sale.soldDate ||
                        sale.createdAt,

                    user: "Admin",

                    action:
                        `Product sold: ${
                            sale.product?.productName ||
                            sale.imei ||
                            "Product"
                        }`
                });

            }
        );


        activities.sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );


        const recentActivity =
            activities.slice(0, 10);


        // =================================================
        // RESPONSE
        // =================================================

        res.status(200).json({

            success: true,

            data: {

                totalProducts,

                totalStock,

                totalBrands,

                lowStock,

                outStock,

                recentProduct,

                topBrand,

                purchaseVsStockOut: {
                    purchases:
                        totalPurchases,

                    sold:
                        totalSold
                },

                brandWiseStock,

                recentActivity

            }

        });

    }

    catch (error) {

        console.error(
            "Dashboard Controller Error:",
            error
        );


        res.status(500).json({

            success: false,

            message:
                "Failed to load dashboard data",

            error:
                error.message

        });

    }
};