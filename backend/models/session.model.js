import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
    {
        sessionId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        email: {
            type: String,
            lowercase: true,
            index: true,
        },
        status: {
            type: String,
            enum: ["active", "revoked", "expired"],
            default: "active",
            index: true,
        },
        authMethod: {
            type: String,
            default: "password",
        },
        device: {
            type: String,
            default: "unknown",
        },
        browser: {
            type: String,
            default: "unknown",
        },
        os: {
            type: String,
            default: "unknown",
        },
        platform: {
            type: String,
            default: "unknown",
        },
        userAgent: {
            type: String,
            default: "",
        },
        ipAddress: {
            type: String,
            default: "unknown",
            index: true,
        },
        location: {
            city: { type: String, default: "" },
            region: { type: String, default: "" },
            country: { type: String, default: "" },
            label: { type: String, default: "unknown" },
        },
        requestCount: {
            type: Number,
            default: 0,
        },
        lastSeenAt: {
            type: Date,
            default: Date.now,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: true,
        },
        revokedAt: {
            type: Date,
            default: null,
        },
        logoutAt: {
            type: Date,
            default: null,
        },
        loginAt: {
            type: Date,
            default: Date.now,
        },
        metadata: {
            route: { type: String, default: "/api/auth/login" },
            purpose: { type: String, default: "account_authentication" },
        },
    },
    {
        timestamps: true,
    }
);

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);

export default Session;