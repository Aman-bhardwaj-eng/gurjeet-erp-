const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// Register Admin
exports.register = async (req, res) => {

    try {

        const { name, username, password } = req.body;

        const exist = await User.findOne({ username });

        if (exist) {

            return res.status(400).json({
                message: "Username Already Exists"
            });

        }

        const hashPassword = await bcrypt.hash(password, 10);

        const user = await User.create({

            name,
            username,
            password: hashPassword

        });

        res.status(201).json({

            success: true,
            message: "Admin Registered Successfully",
            user

        });

    }

    catch (err) {

        res.status(500).json({

            success: false,
            message: err.message

        });

    }

};

// Login

exports.login = async (req, res) => {

    try {

        const { username, password } = req.body;

        const user = await User.findOne({ username });

        if (!user) {

            return res.status(404).json({

                message: "User Not Found"

            });

        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {

            return res.status(400).json({

                message: "Invalid Password"

            });

        }

        const token = jwt.sign(

            {
                id: user._id,
                role: user.role
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "7d"
            }

        );

        res.json({

            success: true,
            token,
            user

        });

    }

    catch (err) {

        res.status(500).json({

            message: err.message

        });

    }

};