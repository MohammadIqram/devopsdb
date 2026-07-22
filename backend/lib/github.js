import { Octokit } from '@octokit/rest';
import dotenv from "dotenv";

dotenv.config();

if (!process.env.GITHUB_PAT) {
    throw new Error('Missing GITHUB_PAT environment variable in server configuration.');
}

export const octokit = new Octokit({
    auth: process.env.GITHUB_PAT,
});

export const GITHUB_OWNER = process.env.GITHUB_OWNER;