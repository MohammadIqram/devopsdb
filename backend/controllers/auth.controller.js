import { createOctokitForUser, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, FRONTEND_URL, BACKEND_URL } from '../lib/github.js';

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