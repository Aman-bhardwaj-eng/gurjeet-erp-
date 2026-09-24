const express = require("express");
const router = express.Router();

const Brand = require("../models/Brand");

router.get("/test", (req, res) => {
    res.json({
        success: true,
        message: "Brand Route Working"
    });
});

router.post("/", async (req, res) => {
    try {
        const { name, status } = req.body;

        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Brand name is required"
            });
        }

        const existing = await Brand.findOne({
            name: name.trim()
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: "Brand already exists"
            });
        }

        const brand = await Brand.create({
            name: name.trim(),
            status: status || "active"
        });

        res.status(201).json({
            success: true,
            message: "Brand created successfully",
            data: brand
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const brands = await Brand.find().sort({ name: 1 });

        res.json({
            success: true,
            count: brands.length,
            data: brands
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
        const brand = await Brand.findById(req.params.id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found"
            });
        }

        res.json({
            success: true,
            data: brand
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
        const brand = await Brand.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found"
            });
        }

        res.json({
            success: true,
            message: "Brand updated successfully",
            data: brand
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
        const brand = await Brand.findByIdAndDelete(req.params.id);

        if (!brand) {
            return res.status(404).json({
                success: false,
                message: "Brand not found"
            });
        }

        res.json({
            success: true,
            message: "Brand deleted successfully"
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