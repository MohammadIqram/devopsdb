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