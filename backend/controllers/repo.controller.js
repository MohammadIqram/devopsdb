import { octokit, GITHUB_OWNER as OWNER } from "../lib/github.js";

export const listJobs = async (req, res) => {
    const { repo } = req.query;
    const targetId = req.params.id;

    try {
        let jobId = targetId;

        // Check if targetId is a Run ID by attempting to list its jobs
        try {
            const { data: jobsData } = await octokit.rest.actions.listJobsForWorkflowRun({
                owner: OWNER,
                repo,
                run_id: targetId,
            });

            if (jobsData.jobs && jobsData.jobs.length > 0) {
                jobId = jobsData.jobs[0].id; // Extract actual job_id
            }
        } catch (err) {
            // If it fails, targetId is already a job_id, proceed below
        }

        // Download the actual log text for the job
        const response = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
            owner: OWNER,
            repo,
            job_id: jobId,
        });

        res.set('Content-Type', 'text/plain');
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching logs:', error.message);
        res.status(404).send(`Unable to download job logs: ${error.message}`);
    }
};

export const listDeployment = async (req, res) => {
    const { repo } = req.query;
    if (!repo) return res.status(400).json({ error: 'Repository name required' });

    try {
        const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
            owner: OWNER,
            repo,
            per_page: 5,
        });

        const runs = data.workflow_runs.map((run) => ({
            id: run.id,
            name: run.name,
            status: run.status,
            conclusion: run.conclusion,
            branch: run.head_branch,
            commit: run.head_commit?.message || 'N/A',
            url: run.html_url,
            createdAt: run.created_at,
        }));

        res.json(runs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deploy = async (req, res) => {
    const { repo, environment, user } = req.body;

    try {
        await octokit.rest.repos.createDispatchEvent({
            owner: OWNER,
            repo,
            event_type: 'custom_deploy_trigger',
            client_payload: { environment, deployed_by: user || 'Dashboard User' },
        });

        res.status(200).json({ success: true, message: `Deployment triggered for ${repo} (${environment})` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getRepos = async (req, res) => {
    try {
        let data;
        try {
            const response = await octokit.rest.repos.listForAuthenticatedUser({
                sort: 'updated',
                per_page: 50,
            });
            data = response.data;
        } catch (authError) {
            console.warn('listForAuthenticatedUser failed, trying listForUser as fallback:', authError.message);
            if (OWNER) {
                const response = await octokit.rest.repos.listForUser({
                    username: OWNER,
                    sort: 'updated',
                    per_page: 50,
                });
                data = response.data;
            } else {
                throw authError;
            }
        }

        const repos = data.map((r) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
        }));

        res.json(repos);
    } catch (error) {
        console.error('Failed to get repositories:', error.message);
        res.status(500).json({ error: error.message });
    }
};

export const removeContributor = async (req, res) => {
    try {
        const { repo, username } = req.body;

        if (!repo || !username) {
            return res.status(400).json({
                error: 'Both repository name and username are required.'
            });
        }

        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
        const owner = repo.includes('/') ? repo.split('/')[0] : OWNER;

        // Remove user/collaborator from the repository
        await octokit.rest.repos.removeCollaborator({
            owner,
            repo: repoName,
            username,
        });

        return res.status(200).json({
            message: `User ${username} successfully removed from ${repoName}`
        });
    } catch (error) {
        console.error('Error removing contributor via Octokit:', error.message);

        if (error.status === 404) {
            return res.status(404).json({ error: 'Repository or user not found on GitHub' });
        }

        return res.status(500).json({
            error: 'Failed to remove contributor from repository',
            details: error.message,
        });
    }
};

export const searchUsers = async (req, res) => {
    try {
        const { q } = req.query;

        if (!q || q.trim().length < 2) {
            return res.status(200).json([]);
        }

        // Octokit search query to check usernames, emails, and full names
        const response = await octokit.rest.search.users({
            q: `${q.trim()} in:login in:name in:email type:user`,
            per_page: 8,
        });

        const users = response.data.items.map((user) => ({
            id: user.id,
            username: user.login,
            avatar: user.avatar_url,
            profileUrl: user.html_url,
        }));

        return res.status(200).json(users);
    } catch (error) {
        console.error('Error searching GitHub users:', error.message);
        return res.status(500).json({
            error: 'Failed to search users on GitHub',
            details: error.message,
        });
    }
};

// 2. Add collaborator to repository
export const addCollaborator = async (req, res) => {
    try {
        const { repo, username, permission = 'push' } = req.body;
        // permission can be 'pull' (read), 'push' (write), or 'admin'

        if (!repo || !username) {
            return res.status(400).json({
                error: 'Both repo and username are required',
            });
        }

        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
        const owner = repo.includes('/') ? repo.split('/')[0] : OWNER;

        // Send invitation to user
        const response = await octokit.rest.repos.addCollaborator({
            owner,
            repo: repoName,
            username,
            permission,
        });

        return res.status(200).json({
            message: `Invitation successfully sent to ${username}!`,
            inviteUrl: response.data?.html_url || null,
        });
    } catch (error) {
        console.error('Error adding collaborator:', error.message);

        if (error.status === 404) {
            return res.status(404).json({ error: 'Repository or User not found' });
        }

        return res.status(500).json({
            error: 'Failed to add collaborator to repository',
            details: error.message,
        });
    }
};