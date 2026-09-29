console.log("🚀 Server.js Started");

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

console.log("✅ Environment Loaded");

// =====================================================
// APP
// =====================================================

const app = express();

// =====================================================
// DATABASE
// =====================================================

const connectDB = require("./config/db");

// =====================================================
// ROUTES
// =====================================================

const authRoutes = require("./routes/authRoutes");
const brandRoutes = require("./routes/brandRoutes");
const productRoutes = require("./routes/productRoutes");
const stockRoutes = require("./routes/stockRoutes");
const barcodeRoutes = require("./routes/barcodeRoutes");
const soldProductRoutes = require("./routes/soldProductRoutes");
const salesRoutes = require("./routes/salesRoutes");

// =====================================================
// MIDDLEWARE
// =====================================================

const verifyToken = require("./middleware/authMiddleware");

// =====================================================
// CONNECT DATABASE
// =====================================================

console.log("🔄 Connecting MongoDB...");

connectDB();

// =====================================================
// EXPRESS MIDDLEWARE
// =====================================================

app.use(cors());

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true
    })
);

// =====================================================
// STATIC FILES
// =====================================================

app.use(
    express.static(
        path.join(__dirname, "public")
    )
);

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);

// =====================================================
// API ROUTES
// =====================================================

// Authentication
app.use(
    "/api/auth",
    authRoutes
);

// Brands
app.use(
    "/api/brands",
    brandRoutes
);

// Products
app.use(
    "/api/products",
    productRoutes
);

// Stock
app.use(
    "/api/stock",
    stockRoutes
);

// Barcode / IMEI
app.use(
    "/api/barcode",
    barcodeRoutes
);

// Sold Products
app.use(
    "/api/sold-products",
    soldProductRoutes
);

// Sales
app.use(
    "/api/sales",
    salesRoutes
);

// =====================================================
// TEST API
// =====================================================

app.get(
    "/test",
    (req, res) => {

        res.json({
            success: true,
            message:
                "Gurjeet Electronics ERP API Working Successfully"
        });

    }
);

// =====================================================
// DASHBOARD API
// =====================================================

app.get(
    "/api/dashboard",
    verifyToken,
    (req, res) => {

        res.json({
            success: true,
            message: "Dashboard API Working",
            user: req.user
        });

    }
);

// =====================================================
// HTML PAGES
// =====================================================

// Home
app.get(
    "/",
    (req, res) => {

        res.send(
            "Gurjeet Electronics Stock ERP Running Successfully"
        );

    }
);

// Login
app.get(
    "/login",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "login.html"
            )
        );

    }
);

// Register
app.get(
    "/register",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "register.html"
            )
        );

    }
);

// Dashboard
app.get(
    "/dashboard",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "dashboard.html"
            )
        );

    }
);

// Brands
app.get(
    "/brands",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "brands.html"
            )
        );

    }
);

// Products
app.get(
    "/products",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "products.html"
            )
        );

    }
);

// Stock
app.get(
    "/stock",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "stock.html"
            )
        );

    }
);

// Barcode
app.get(
    "/barcode",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "barcode.html"
            )
        );

    }
);

// Sold Products
app.get(
    "/sold-products",
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "views",
                "sold-products.html"
            )
        );

    }
);

// =====================================================
// API 404 HANDLER
// =====================================================

app.use(
    "/api",
    (req, res) => {

        res.status(404).json({
            success: false,
            message: "API route not found",
            route: req.originalUrl
        });

    }
);

// =====================================================
// GENERAL 404 HANDLER
// =====================================================

app.use(
    (req, res) => {

        res.status(404).send(
            "Page Not Found"
        );

    }
);

// =====================================================
// SERVER
// =====================================================

const PORT =
    process.env.PORT || 5000;

app.listen(
    PORT,
    () => {

        console.log(
            "============================================"
        );

        console.log(
            `✅ Server Running On Port ${PORT}`
        );

        console.log(
            `🌐 http://localhost:${PORT}`
        );

        console.log(
            `📊 Dashboard: http://localhost:${PORT}/dashboard`
        );

        console.log(
            `📦 Stock API: http://localhost:${PORT}/api/stock`
        );

        console.log(
            `📱 Barcode API: http://localhost:${PORT}/api/barcode`
        );

        console.log(
            `🛒 Sold Products API: http://localhost:${PORT}/api/sold-products`
        );

        console.log(
            `💰 Sales API: http://localhost:${PORT}/api/sales`
        );

        console.log(
            "============================================"
        );

    }
);