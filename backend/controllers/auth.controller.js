import { createOctokitForUser, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, FRONTEND_URL, BACKEND_URL } from '../lib/github.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import crypto from "crypto";
import Session from "../models/session.model.js";

const CONSENT_VERSION = "2026-06-17";
const PHONE_CONSENT_VERSION = "2026-06-17";
const CONSENT_PURPOSE = "account_creation_and_service_delivery";
const PHONE_CONSENT_PURPOSE = "phone_number_processing_for_account_security_and_support";
const SESSION_PURPOSE = "account_authentication";
const toBoolean = (value) => value === true || value === "true";

const getClientIp = (req) => {
    const forwardedFor = req.headers["x-forwarded-for"];
    const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0]?.trim();
    return req.headers["cf-connecting-ip"] || forwardedIp || req.ip || req.socket?.remoteAddress || "unknown";
};

const parseUserAgent = (userAgent = "") => {
    const ua = String(userAgent);
    const lower = ua.toLowerCase();

    const device = /mobile|iphone|android/.test(lower)
        ? "mobile"
        : /ipad|tablet/.test(lower)
            ? "tablet"
            : "desktop";

    const browser = /edg\//.test(lower)
        ? "Edge"
        : /chrome\//.test(lower)
            ? "Chrome"
            : /safari\//.test(lower) && !/chrome\//.test(lower)
                ? "Safari"
                : /firefox\//.test(lower)
                    ? "Firefox"
                    : /msie|trident/.test(lower)
                        ? "Internet Explorer"
                        : "Unknown";

    const os = /windows nt/.test(lower)
        ? "Windows"
        : /android/.test(lower)
            ? "Android"
            : /iphone|ipad|ios/.test(lower)
                ? "iOS"
                : /mac os x/.test(lower)
                    ? "macOS"
                    : /linux/.test(lower)
                        ? "Linux"
                        : "Unknown";

    return {
        device,
        browser,
        os,
        platform: device,
    };
};

const getLocationFromRequest = (req) => {
    const city = String(req.headers["cf-ipcity"] || "").trim();
    const region = String(req.headers["cf-region"] || req.headers["cf-region-code"] || "").trim();
    const country = String(req.headers["cf-ipcountry"] || "").trim();

    const label = [city, region, country].filter(Boolean).join(", ") || "unknown";

    return {
        city,
        region,
        country,
        label,
    };
};

const buildSessionDetails = (req) => {
    const userAgent = String(req.headers["user-agent"] || "");
    const ipAddress = getClientIp(req);
    const location = getLocationFromRequest(req);
    const deviceDetails = parseUserAgent(userAgent);

    return {
        userAgent,
        ipAddress,
        location,
        ...deviceDetails,
    };
};

const createSessionRecord = async (req, user, sessionId) => {
    const sessionDetails = buildSessionDetails(req);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    return Session.create({
        sessionId,
        user: user._id,
        email: user.email,
        status: "active",
        authMethod: "password",
        device: sessionDetails.device,
        browser: sessionDetails.browser,
        os: sessionDetails.os,
        platform: sessionDetails.platform,
        userAgent: sessionDetails.userAgent,
        ipAddress: sessionDetails.ipAddress,
        location: sessionDetails.location,
        requestCount: 1,
        lastSeenAt: now,
        loginAt: now,
        expiresAt,
        metadata: {
            route: req.originalUrl,
            purpose: SESSION_PURPOSE,
        },
    });
};

const updateSessionTouch = async (sessionId, req, extraUpdates = {}) => {
    if (!sessionId) return null;

    const sessionDetails = buildSessionDetails(req);
    const update = {
        $inc: { requestCount: 1 },
        $set: {
            lastSeenAt: new Date(),
            device: sessionDetails.device,
            browser: sessionDetails.browser,
            os: sessionDetails.os,
            platform: sessionDetails.platform,
            userAgent: sessionDetails.userAgent,
            ipAddress: sessionDetails.ipAddress,
            location: sessionDetails.location,
            ...extraUpdates,
        },
    };

    return Session.findOneAndUpdate(
        { sessionId },
        update,
        { new: true }
    );
};

// Helper to generate a single JWT token
const generateToken = (userId, email, sessionId) => {
    return jwt.sign({ id: userId, sessionId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * @route POST /api/auth/signup
 */
export async function signup(req, res) {
    try {
        const { name, email, password, consents } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please fill in all fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        await User.create({
            name, email, password,
            consents: {
                termsOfService: {
                    accepted: consents?.termsOfService?.accepted ?? true,
                    acceptedAt: new Date(),
                    version: 'v1.0',
                },
                privacyPolicy: {
                    accepted: consents?.privacyPolicy?.accepted ?? true,
                    acceptedAt: new Date(),
                    version: 'v1.0',
                },
                marketingEmails: {
                    accepted: Boolean(consents?.marketingEmails?.accepted),
                    updatedAt: new Date(),
                },
            },
        });
        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
        });
    } catch (error) {
        console.error('Signup Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during signup' });
    }
}

/**
 * @route POST /api/auth/login
 */
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const sessionId = crypto.randomUUID();
        try {
            await createSessionRecord(req, user, sessionId);
        } catch (sessionError) {
            console.error("Failed to create session audit record:", sessionError.message);
        }
        req.session.user = {
            id: user._id,
            email: user.email,
            sessionId: sessionId,
        };

        req.session.save((err) => {
            if (err) {
                console.log('error when saving the session: ', err.message);
                return res.status(500).json({ success: false, message: 'Server error' });
            }
            return res.status(200).json({
                success: true,
                message: 'Logged in successfully',
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                },
            });
        })

    } catch (error) {
        console.error('Login Error:', error);
        return res.status(500).json({ success: false, message: 'Server error during login' });
    }
}

export async function initiateGithubAuth(req, res) {
    const redirectUri = `${BACKEND_URL}/api/auth/github/callback`;
    const scopes = ['repo', 'workflow', 'write:packages'].join(' ');

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
    )}&scope=${encodeURIComponent(scopes)}`;

    return res.redirect(githubAuthUrl);
}

export async function handleGithubCallback(req, res) {
    const { code, error } = req.query;

    if (error || !code) {
        return res.redirect(`${FRONTEND_URL}/onboarding/app-selection?error=access_denied`);
    }

    try {
        // 1. Exchange temporary code for access token
        const tokenResponse = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: GITHUB_CLIENT_ID,
                client_secret: GITHUB_CLIENT_SECRET,
                code: String(code),
            },
            {
                headers: { Accept: 'application/json' },
            }
        );

        const { access_token } = tokenResponse.data;

        if (!access_token) {
            throw new Error('Failed to obtain access token from GitHub.');
        }

        // 2. Instantiate Octokit using your helper to test and fetch profile info
        const octokit = createOctokitForUser(access_token);
        const { data: githubUser } = await octokit.rest.users.getAuthenticated();

        // 3. Save access_token in DB tied to your current user session
        // Example (Prisma/DB):
        // await db.user.update({
        //   where: { id: req.user.id },
        //   data: { githubAccessToken: access_token, githubUsername: githubUser.login }
        // });

        // 4. Redirect back to Next.js frontend onboarding page
        return res.redirect(`${FRONTEND_URL}/onboarding/app-selection?status=github_connected`);
    } catch (err) {
        console.error('GitHub Auth Error:', err);
        return res.redirect(`${FRONTEND_URL}/onboarding/app-selection?error=token_exchange_failed`);
    }
}

/**
 * Example controller showing how to execute Octokit actions on behalf of a user
 */
export async function getUserRepositories(req, res) {
    try {
        // Retrieve user's stored access token from session/DB
        const userAccessToken = req.user?.githubAccessToken;

        // Instantiate Octokit for this user
        const octokit = createOctokitForUser(userAccessToken);

        // Perform operations
        const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 10,
        });

        return res.status(200).json({ success: true, repos });
    } catch (error) {
        console.error('Error fetching repositories:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function logout(req, res) {
    try {
        if (!req.session) {
            return res.status(200).json({
                success: true,
                message: 'Already logged out',
            });
        }
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout / Session Destroy Error:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Could not log out, please try again.',
                });
            }

            res.clearCookie('connect.sid', {
                path: '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
            });

            return res.status(200).json({
                success: true,
                message: 'Logged out successfully',
            });
        });
    } catch (error) {
        console.error('Logout Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during logout',
        });
    }
}