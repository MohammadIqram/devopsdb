import { octokit, GITHUB_OWNER as OWNER } from "../lib/github.js";
import path from 'path';
import simpleGit from 'simple-git';

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

export const getBranches = async (req, res) => {
    try {
        const { repo, page = 1, limit = 10 } = req.query;

        if (!repo) {
            return res.status(400).json({ error: 'Repository name is required' });
        }

        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
        const owner = repo.includes('/') ? repo.split('/')[0] : OWNER;

        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);

        // Fetch branches list
        const response = await octokit.rest.repos.listBranches({
            owner,
            repo: repoName,
            per_page: limitNum,
            page: pageNum,
        });

        const branches = response.data.map((branch) => ({
            name: branch.name,
            protected: branch.protected,
            sha: branch.commit.sha,
        }));

        return res.status(200).json({
            branches,
            page: pageNum,
            limit: limitNum,
            hasMore: response.data.length === limitNum,
        });
    } catch (error) {
        console.error('Error fetching branches:', error.message);
        return res.status(500).json({
            error: 'Failed to fetch branches',
            details: error.message,
        });
    }
};

// 2. View file content/tree of a specific branch
export const getBranchTree = async (req, res) => {
    try {
        const { repo, branch, path = '' } = req.query;

        if (!repo || !branch) {
            return res.status(400).json({ error: 'Repo and branch parameters are required' });
        }

        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
        const owner = repo.includes('/') ? repo.split('/')[0] : OWNER;

        const response = await octokit.rest.repos.getContent({
            owner,
            repo: repoName,
            ref: branch,
            path,
        });

        // Format content response
        const contents = Array.isArray(response.data)
            ? response.data.map((item) => ({
                name: item.name,
                path: item.path,
                type: item.type, // 'file' or 'dir'
                size: item.size,
                downloadUrl: item.download_url,
            }))
            : [
                {
                    name: response.data.name,
                    path: response.data.path,
                    type: response.data.type,
                    size: response.data.size,
                    downloadUrl: response.data.download_url,
                    content: response.data.content
                        ? Buffer.from(response.data.content, 'base64').toString('utf-8')
                        : null,
                },
            ];

        return res.status(200).json(contents);
    } catch (error) {
        console.error('Error fetching repo tree:', error.message);
        return res.status(500).json({
            error: 'Failed to fetch repository tree for branch',
            details: error.message,
        });
    }
};

// 3. Delete single branch
export const deleteBranch = async (req, res) => {
    try {
        const { repo, branch } = req.body;

        if (!repo || !branch) {
            return res.status(400).json({ error: 'Repo and branch are required' });
        }

        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
        const owner = repo.includes('/') ? repo.split('/')[0] : OWNER;

        await octokit.rest.git.deleteRef({
            owner,
            repo: repoName,
            ref: `heads/${branch}`,
        });

        return res.status(200).json({ message: `Branch '${branch}' deleted successfully.` });
    } catch (error) {
        console.error('Error deleting branch:', error.message);
        return res.status(500).json({
            error: `Failed to delete branch '${req.body.branch}'`,
            details: error.message,
        });
    }
};

// 4. Bulk delete branches
export const deleteBranchesBulk = async (req, res) => {
    try {
        const { repo, branches } = req.body;

        if (!repo || !Array.isArray(branches) || branches.length === 0) {
            return res.status(400).json({ error: 'Repo and an array of branches are required' });
        }

        const repoName = repo.includes('/') ? repo.split('/')[1] : repo;
        const owner = repo.includes('/') ? repo.split('/')[0] : OWNER;

        const results = await Promise.allSettled(
            branches.map((branch) =>
                octokit.rest.git.deleteRef({
                    owner,
                    repo: repoName,
                    ref: `heads/${branch}`,
                })
            )
        );

        const deleted = [];
        const failed = [];

        results.forEach((res, index) => {
            const branchName = branches[index];
            if (res.status === 'fulfilled') {
                deleted.push(branchName);
            } else {
                failed.push({ branch: branchName, reason: res.reason?.message || 'Error deleting' });
            }
        });

        return res.status(200).json({
            message: `Processed ${branches.length} branches`,
            deleted,
            failed,
        });
    } catch (error) {
        console.error('Bulk deletion error:', error.message);
        return res.status(500).json({
            error: 'Failed to process bulk deletion',
            details: error.message,
        });
    }
};

export const getRepoDetails = async (req, res) => {
    try {
        const { repoName } = req.params;

        if (!repoName) {
            return res.status(400).json({ error: 'Repository name parameter is required' });
        }

        const owner = OWNER;

        // Fetch repository details, branches, recent commits, and languages in parallel
        const [repoRes, branchesRes, commitsRes, languagesRes] = await Promise.all([
            octokit.rest.repos.get({ owner, repo: repoName }),
            octokit.rest.repos.listBranches({ owner, repo: repoName, per_page: 5 }),
            octokit.rest.repos.listCommits({ owner, repo: repoName, per_page: 5 }),
            octokit.rest.repos.listLanguages({ owner, repo: repoName }),
        ]);

        const repoData = repoRes.data;

        return res.status(200).json({
            details: {
                id: repoData.id,
                name: repoData.name,
                fullName: repoData.full_name,
                private: repoData.private,
                description: repoData.description,
                defaultBranch: repoData.default_branch,
                stars: repoData.stargazers_count,
                forks: repoData.forks_count,
                openIssues: repoData.open_issues_count,
                size: repoData.size,
                htmlUrl: repoData.html_url,
                createdAt: repoData.created_at,
                updatedAt: repoData.updated_at,
            },
            branches: branchesRes.data.map((b) => ({ name: b.name, sha: b.commit.sha })),
            recentCommits: commitsRes.data.map((c) => ({
                sha: c.sha.substring(0, 7),
                message: c.commit.message,
                author: c.commit.author?.name || 'Unknown',
                date: c.commit.author?.date,
            })),
            languages: languagesRes.data,
        });
    } catch (error) {
        console.error('Error fetching repo details:', error.message);
        return res.status(500).json({
            error: 'Failed to fetch repository details',
            details: error.message,
        });
    }
};

export const downloadFile = async (req, res) => {
    const { repo, branch, path: filePath } = req.query;

    if (!repo || !branch || !filePath) {
        return res.status(400).json({ error: 'Missing repo, branch, or file path parameter' });
    }

    try {
        const repoPath = path.join(process.env.REPOS_ROOT_DIR || '/tmp/repos', repo);
        const git = simpleGit(repoPath);

        // Get raw file buffer directly from git tree without needing to checkout the branch
        const fileBuffer = await git.binaryCatFile([`${branch}:${filePath}`]);

        const fileName = path.basename(filePath);

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        return res.send(fileBuffer);
    } catch (err) {
        console.error('File download error:', err);
        return res.status(500).json({ error: 'Failed to retrieve file content' });
    }
};