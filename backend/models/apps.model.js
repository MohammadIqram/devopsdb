import mongoose from 'mongoose';

const connectedAppSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        provider: {
            type: String,
            required: true,
            enum: ['github', 'neon', 'hostinger', 'aws', 'vercel'],
        },
        accessToken: {
            type: String,
            required: true,
            select: false,
        },
        refreshToken: {
            type: String,
            select: false,
        },
        tokenExpiresAt: {
            type: Date,
        },
        externalAccountId: {
            type: String,
            trim: true,
        },
        externalAccountName: {
            type: String,
            trim: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        status: {
            type: String,
            enum: ['active', 'invalid', 'revoked'],
            default: 'active',
        },
        lastVerifiedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

connectedAppSchema.index({ user: 1, provider: 1 }, { unique: true });
export const ConnectedApp = mongoose.models.ConnectedApp || mongoose.model('ConnectedApp', connectedAppSchema);