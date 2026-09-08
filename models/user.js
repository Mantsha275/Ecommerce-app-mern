import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please enter your name"],
        trim: true,
        maxLength: [30, "Your name cannot exceed 30 characters"],
    },
    email: {
        type: String,
        required: [true, "Please enter your email"],
        unique: true,
        trim: true,
        lowercase: true,
        validate: [validator.isEmail, "Please enter valid email address"],
    },
    phone: {
        type: String,
        required: false,
        maxLength: [200, "Your phone number cannot exceed 200 characters"],
    },
    address: {
        type: String,
        required: false,
        maxLength: [200, "Your address cannot exceed 200 characters"],
    },
    password: {
        type: String,
        required: [true, "Please enter your password"],
        minlength: [6, "Your password must be longer than 6 characters"],
        select: false,
    },
    avatar: {
        public_id: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    role: {
        type: String,
        default: "user",
        enum: {
            values: ["user", "admin"],
            message: "Role must be either 'user' or 'admin'",
        },
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
});

userSchema.index({ email: 1 });

// Encrypting password before saving user.
// BUG FIX: the original code called `next()` when the password wasn't
// modified but didn't `return`, so execution fell through and re-hashed
// `this.password` anyway (re-hashing an already-hashed password, or hashing
// `undefined` when the field wasn't selected/loaded - e.g. during
// forgotPassword's `user.save()`). Returning here makes the guard actually work.
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) {
        return next();
    }

    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Compare user password
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Return JWT token
userSchema.methods.getJwtToken = function () {
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_TIME || "7d",
    });
};

// Generate password reset token
userSchema.methods.getResetPasswordToken = function () {
    const resetToken = crypto.randomBytes(20).toString("hex");

    this.resetPasswordToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

    return resetToken;
};

export default mongoose.model("User", userSchema);
