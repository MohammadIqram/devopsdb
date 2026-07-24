import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: 6,
            select: false, // Security: Excludes password field by default in queries
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },

        // --- COMPLIANCE & LEGAL CONSENTS ---
        consents: {
            // Mandatory Consents
            termsOfService: {
                accepted: {
                    type: Boolean,
                    required: [true, 'Terms of Service acceptance is required'],
                    default: false,
                },
                acceptedAt: {
                    type: Date,
                    default: null,
                },
                version: {
                    type: String,
                    default: 'v1.0', // Helps track which legal version they signed
                },
            },
            privacyPolicy: {
                accepted: {
                    type: Boolean,
                    required: [true, 'Privacy Policy acceptance is required'],
                    default: false,
                },
                acceptedAt: {
                    type: Date,
                    default: null,
                },
                version: {
                    type: String,
                    default: 'v1.0',
                },
            },

            // Optional / Secondary Consents
            marketingEmails: {
                accepted: {
                    type: Boolean,
                    default: false,
                },
                updatedAt: {
                    type: Date,
                    default: null,
                },
            },
            thirdPartyDataSharing: {
                accepted: {
                    type: Boolean,
                    default: false, // For Hostinger/Neon integrations if required
                },
                updatedAt: {
                    type: Date,
                    default: null,
                },
            },
        },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return;
});

// Instance method to compare passwords
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;