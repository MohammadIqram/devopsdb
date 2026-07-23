import { Octokit } from '@octokit/rest';
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

if (!process.env.GITHUB_PAT) {
    throw new Error('Missing GITHUB_PAT environment variable in server configuration.');
}

export const octokit = new Octokit({
    auth: process.env.GITHUB_PAT,
});

export const GITHUB_OWNER = process.env.GITHUB_OWNER;

/**
 * Creates an Octokit instance scoped specifically to a logged-in user.
 * @param userAccessToken Token retrieved from your database for the user.
 */
export function createOctokitForUser(userAccessToken) {
    if (!userAccessToken) {
        throw new Error('User is not connected to GitHub.');
    }

    return new Octokit({
        auth: userAccessToken,
    });
}

export const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:4000/api';