import { octokit, GITHUB_OWNER } from '../lib/github.js';

export const getRepoContributors = async (req, res) => {
    try {
        const { repo } = req.query;

        if (!repo) {
            return res.status(400).json({ error: 'Repository name is required' });
        }

        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
        const owner = repo.includes('/') ? repo.split('/')[0] : GITHUB_OWNER;
        const response = await octokit.rest.repos.listContributors({
            owner,
            repo: repoName,
            per_page: 30,
        });

        const contributors = response.data.map((user) => ({
            id: user.id,
            username: user.login,
            avatar: user.avatar_url,
            contributions: user.contributions,
            profileUrl: user.html_url,
            type: user.type,
        }));

        return res.status(200).json(contributors);
    } catch (error) {
        console.error('Error fetching GitHub contributors via Octokit:', error.message);

        if (error.status === 404) {
            return res.status(404).json({ error: 'Repository not found on GitHub' });
        }

        return res.status(500).json({
            error: 'Failed to retrieve repository contributors',
            details: error.message,
        });
    }
};

export const inviteUser = async (req, res) => {
    // 2. Invite a new team member
    const { email, role } = req.body;
    res.status(201).json({ message: `Invitation sent to ${email} as ${role}`, id: Date.now().toString() });
};

export const updateUserRole = async (req, res) => {
    // 3. Update user permissions/role
    const { id } = req.params;
    const { role } = req.body;
    res.json({ message: `User ${id} role updated to ${role}` });
};

export const toggleUserStatus = async (req, res) => {
    // 4. Activate or suspend user access
    const { id } = req.params;
    const { status } = req.body; // 'Active' or 'Suspended'
    res.json({ message: `User ${id} status set to ${status}` });
};

export const deleteUser = async (req, res) => {
    // 5. Revoke access & delete user
    const { id } = req.params;
    res.json({ message: `User ${id} removed from system` });
};

export const getUserAuditLogs = async (req, res) => {
    // 6. Get user activity audit logs
    const { id } = req.params;
    res.json([
        { timestamp: new Date().toISOString(), action: 'Triggered Production Deploy', repo: 'rtospecialistbackend' },
        { timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'Changed Webhook URL', repo: 'frontend-app' },
    ]);
};