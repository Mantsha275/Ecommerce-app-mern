import crypto from "crypto";
import cloudinary from "cloudinary";
import User from "../models/user.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import sendToken from "../utils/jwtToken.js";
import sendEmail from "../utils/sendEmail.js";
import { logAdminAction } from "../utils/auditLog.js";

// Register a user   => /api/v1/register
export const registerUser = catchAsyncErrors(async (req, res, next) => {
    const { name, email, password } = req.body;

    if (!req.body.avatar) {
        return next(new ErrorHandler("Please upload an avatar image", 400));
    }

    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "shopx/avatar",
        width: 150,
        crop: "scale",
    });

    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: result.public_id,
            url: result.secure_url,
        },
    });

    sendToken(user, 200, res);
});

// Login User  =>  /api/v1/login
export const loginUser = catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Please enter email & password", 400));
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    const isPasswordMatched = await user.comparePassword(password);

    if (!isPasswordMatched) {
        return next(new ErrorHandler("Invalid Email or Password", 401));
    }

    sendToken(user, 200, res);
});

// Forgot Password   =>  /api/v1/password/forgot
export const forgotPassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    // SECURITY: don't reveal whether an email exists in the system - always
    // return the same generic response either way. Only proceed to actually
    // send an email if the account is real.
    const genericResponse = {
        success: true,
        message:
            "If an account with that email exists, a password reset email has been sent.",
    };

    if (!user) {
        return res.status(200).json(genericResponse);
    }

    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Use a configured frontend URL rather than trusting req.protocol/req.get("host"),
    // which can be spoofed via the Host header and would let an attacker
    // send victims a reset link pointing at a phishing domain.
    const clientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get("host")}`;
    const resetUrl = `${clientUrl}/password/reset/${resetToken}`;

    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested this email, then ignore it.`;

    try {
        await sendEmail({
            email: user.email,
            subject: "ShopX Password Recovery",
            message,
        });

        res.status(200).json(genericResponse);
    } catch (error) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save({ validateBeforeSave: false });

        return next(
            new ErrorHandler(
                "Email could not be sent. Please try again later.",
                500
            )
        );
    }
});

// Reset Password   =>  /api/v1/password/reset/:token
export const resetPassword = catchAsyncErrors(async (req, res, next) => {
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
        return next(
            new ErrorHandler(
                "Password reset token is invalid or has been expired",
                400
            )
        );
    }

    if (req.body.password !== req.body.confirmPassword) {
        return next(new ErrorHandler("Password does not match", 400));
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    sendToken(user, 200, res);
});

// Get currently logged in user details   =>   /api/v1/me
export const getUserProfile = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user,
    });
});

// Update / Change password   =>  /api/v1/password/update
export const updatePassword = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const isMatched = await user.comparePassword(req.body.oldPassword);
    if (!isMatched) {
        return next(new ErrorHandler("Old password is incorrect", 400));
    }

    user.password = req.body.password;
    await user.save();

    sendToken(user, 200, res);
});

// Update user profile   =>   /api/v1/me/update
export const updateProfile = catchAsyncErrors(async (req, res, next) => {
    const newUserData = {
        name: req.body.name,
        address: req.body.address,
        phone: req.body.phone,
    };

    if (req.body.avatar !== "" && req.body.avatar !== undefined) {
        const user = await User.findById(req.user.id);

        const image_id = user.avatar.public_id;
        await cloudinary.v2.uploader.destroy(image_id);

        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: "shopx/avatar",
            width: 150,
            crop: "scale",
        });

        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url,
        };
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        user,
    });
});

// Logout user   =>   /api/v1/logout
export const logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
        expires: new Date(Date.now()),
        httpOnly: true,
    });

    res.status(200).json({
        success: true,
        message: "Logged out",
    });
});

// ---- Admin Routes ----

// Get all users   =>   /api/v1/admin/users
export const allUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users,
    });
});

// Get user details   =>   /api/v1/admin/user/:id
export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(
            new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
        );
    }

    res.status(200).json({
        success: true,
        user,
    });
});

// Update user (role/name/email)   =>   /api/v1/admin/user/:id
export const updateUser = catchAsyncErrors(async (req, res, next) => {
    const previousUser = await User.findById(req.params.id);

    if (!previousUser) {
        return next(
            new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
        );
    }

    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
    };

    const user = await User.findByIdAndUpdate(req.params.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    // Role changes are the security-sensitive part of this endpoint (an
    // admin granting/revoking admin access) - logged with an explicit
    // from/to even though name/email changes go through this same route,
    // since a role change is what an audit trail is realistically for here.
    await logAdminAction({
        admin: req.user,
        action: "user.update",
        targetType: "User",
        targetId: user._id,
        details:
            previousUser.role !== user.role
                ? { roleChangedFrom: previousUser.role, roleChangedTo: user.role }
                : { updatedFields: Object.keys(req.body) },
    });

    res.status(200).json({
        success: true,
        user,
    });
});

// Delete user   =>   /api/v1/admin/user/:id
export const deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(
            new ErrorHandler(`User not found with id: ${req.params.id}`, 404)
        );
    }

    const image_id = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(image_id);

    await user.deleteOne();

    await logAdminAction({
        admin: req.user,
        action: "user.delete",
        targetType: "User",
        targetId: req.params.id,
        details: { email: user.email, role: user.role },
    });

    res.status(200).json({
        success: true,
    });
});
