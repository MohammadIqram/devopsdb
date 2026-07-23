import { createOctokitForUser, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, FRONTEND_URL, BACKEND_URL } from '../lib/github.js';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_fallback_super_secret_key';

// Helper to generate a single JWT token
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};

/**
 * @route POST /api/auth/signup
 */
export async function signup(req, res) {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please fill in all fields' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists with this email' });
        }

        await User.create({ name, email, password });
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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        const token = generateToken(user._id);
        res.cookie("devops_session", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        return res.status(200).json({
            success: true,
            message: 'Logged in successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
            },
        });
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