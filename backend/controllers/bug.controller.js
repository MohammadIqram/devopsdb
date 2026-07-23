import { octokit, GITHUB_OWNER as OWNER } from "../lib/github.js";

export const getBugs = async (req, res) => {
    const { repo } = req.query;
    if (!repo) return res.status(400).json({ error: 'Repository name required' });

    try {
        const { data: issues } = await octokit.rest.issues.listForRepo({
            owner: OWNER,
            repo,
            state: 'open',
            labels: 'bug,critical',
        });

        const bugs = issues.map((issue) => ({
            id: issue.id,
            number: issue.number,
            title: issue.title,
            author: issue.user.login,
            url: issue.html_url,
            createdAt: issue.created_at,
        }));

        res.json(bugs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createBug = async (req, res) => {
    const { title, priority, repo } = req.body;
    res.status(201).json({ id: `bug_${Date.now()}`, title, priority, status: 'Open', repo });
};

export const updateBugStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    res.json({ message: `Bug ${id} updated to ${status}` });
};