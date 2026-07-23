import { octokit, GITHUB_OWNER as OWNER } from "../lib/github.js";
import _sodium from 'libsodium-wrappers';

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
        const owner = OWNER;
        const repoName = repo;

        const cleanFilePath = filePath.replace(/^\/+/, '');

        // Fetch file content directly from GitHub API
        const { data } = await octokit.rest.repos.getContent({
            owner,
            repo: repoName,
            path: cleanFilePath,
            ref: branch,
        });

        if (Array.isArray(data) || data.type !== 'file') {
            return res.status(400).json({ error: 'Target path is not a file.' });
        }

        // GitHub returns files in base64
        const fileBuffer = Buffer.from(data.content, 'base64');

        res.setHeader('Content-Disposition', `attachment; filename="${data.name}"`);
        res.setHeader('Content-Type', 'application/octet-stream');
        return res.send(fileBuffer);
    } catch (err) {
        console.error('File download error:', err);
        return res.status(500).json({ error: 'Failed to retrieve file content' });
    }
};

export const downloadRepoZip = async (req, res) => {
    const { repo, ref } = req.query;

    if (!repo) {
        return res.status(400).json({ error: 'Repository name parameter is required.' });
    }

    try {
        let owner = OWNER;
        let repoName = repo;

        if (repo.includes('/')) {
            [owner, repoName] = repo.split('/');
        }

        // Download archive binary buffer from GitHub REST API
        const response = await octokit.rest.repos.downloadZipballArchive({
            owner,
            repo: repoName,
            ref: ref || 'main',
        });

        const buffer = Buffer.from(response.data);

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${repoName}-${ref || 'main'}.zip"`
        );
        return res.send(buffer);
    } catch (err) {
        console.error('Error fetching repo zip archive:', err);
        return res.status(500).json({ error: 'Failed to download repository ZIP archive.' });
    }
};

export const createCicdPr = async (req, res) => {
    const { repo, filename, yamlContent, branchName, commitMessage, prTitle } = req.body;

    if (!repo || !yamlContent || !filename || !branchName) {
        return res.status(400).json({ error: 'Missing required parameters.' });
    }

    try {
        let owner = OWNER;
        let repoName = repo;
        if (repo.includes('/')) {
            [owner, repoName] = repo.split('/');
        }

        // 1. Get repository details to find default branch (e.g. main / master)
        const { data: repoDetails } = await octokit.rest.repos.get({ owner, repo: repoName });
        const defaultBranch = repoDetails.default_branch;

        // 2. Fetch latest commit SHA from default branch
        const { data: refData } = await octokit.rest.git.getRef({
            owner,
            repo: repoName,
            ref: `heads/${defaultBranch}`,
        });
        const baseSha = refData.object.sha;

        // 3. Create new target branch off default branch SHA
        await octokit.rest.git.createRef({
            owner,
            repo: repoName,
            ref: `refs/heads/${branchName}`,
            sha: baseSha,
        });

        // 4. Commit workflow YML script inside .github/workflows/ folder
        const targetFilePath = `.github/workflows/${filename}`;
        const contentBase64 = Buffer.from(yamlContent).toString('base64');

        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo: repoName,
            path: targetFilePath,
            message: commitMessage || `ci: add ${filename} workflow`,
            content: contentBase64,
            branch: branchName,
        });

        // 5. Open Pull Request to merge back into default branch
        const { data: pr } = await octokit.rest.pulls.create({
            owner,
            repo: repoName,
            title: prTitle || `Add ${filename} deployment workflow`,
            head: branchName,
            base: defaultBranch,
            body: `Automated PR generated from CI/CD Setup wizard.\n\n**Added file:** \`${targetFilePath}\``,
        });

        return res.status(201).json({
            success: true,
            prNumber: pr.number,
            prUrl: pr.html_url,
            branch: branchName,
        });

    } catch (err) {
        console.error('CI/CD PR Creation error:', err);
        return res.status(err.status || 500).json({
            error: err.message || 'Failed to create pull request for deployment script.',
        });
    }
};

// Helper to parse "owner/repo" or use default owner
const parseRepo = (repoParam) => {
    if (repoParam.includes('/')) {
        const [owner, repo] = repoParam.split('/');
        return { owner, repo };
    }
    return { owner: OWNER, repo: repoParam };
};

export const checkOrCreatePr = async (req, res) => {
    const { repo: repoParam, head, base, title, body } = req.body;

    if (!repoParam || !head || !base) {
        return res.status(400).json({ error: 'Missing repo, head, or base branch.' });
    }

    if (head === base) {
        return res.status(400).json({ error: 'Head and base branches cannot be identical.' });
    }

    const { owner, repo } = parseRepo(repoParam);

    try {
        // 1. Check if an open PR already exists for this head -> base combination
        const { data: existingPrs } = await octokit.rest.pulls.list({
            owner,
            repo,
            state: 'open',
            head: `${owner}:${head}`,
            base,
        });

        if (existingPrs.length > 0) {
            const pr = existingPrs[0];
            return res.status(200).json({
                isExisting: true,
                prNumber: pr.number,
                prUrl: pr.html_url,
                title: pr.title,
                state: pr.state,
                canMerge: pr.mergeable ?? true,
            });
        }

        // 2. If no open PR exists, create a new Pull Request
        const { data: newPr } = await octokit.rest.pulls.create({
            owner,
            repo,
            title: title || `Merge ${head} into ${base}`,
            head,
            base,
            body: body || `Automated Pull Request to merge \`${head}\` into \`${base}\`.`,
        });

        return res.status(201).json({
            isExisting: false,
            prNumber: newPr.number,
            prUrl: newPr.html_url,
            title: newPr.title,
            state: newPr.state,
            canMerge: true,
        });
    } catch (err) {
        console.error('Error checking or creating PR:', err);
        return res.status(err.status || 500).json({
            error: err.message || 'Failed to check or create pull request.',
        });
    }
};

export const getRepoPullRequests = async (req, res) => {
    const { repo: repoParam } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const state = req.query.state || 'open'; // 'open', 'closed', or 'all'

    const { owner, repo } = parseRepo(repoParam);

    try {
        const { data: prs } = await octokit.rest.pulls.list({
            owner,
            repo,
            state,
            per_page: limit,
            page,
        });

        return res.status(200).json({
            prs: prs.map((pr) => ({
                id: pr.id,
                number: pr.number,
                title: pr.title,
                state: pr.state,
                user: pr.user.login,
                userAvatar: pr.user.avatar_url,
                head: pr.head.ref,
                base: pr.base.ref,
                createdAt: pr.created_at,
                htmlUrl: pr.html_url,
                draft: pr.draft,
            })),
            page,
            limit,
            hasMore: prs.length === limit,
        });
    } catch (err) {
        console.error('Error fetching PRs:', err);
        return res.status(err.status || 500).json({ error: err.message });
    }
};

export const getPullRequestDetails = async (req, res) => {
    const { repo: repoParam, id: prNumber } = req.params;
    const { owner, repo } = parseRepo(repoParam);

    try {
        const pull_number = parseInt(prNumber);

        // Fetch PR details, files changed, and comments in parallel
        const [prRes, filesRes, commentsRes] = await Promise.all([
            octokit.rest.pulls.get({ owner, repo, pull_number }),
            octokit.rest.pulls.listFiles({ owner, repo, pull_number }),
            octokit.rest.issues.listComments({ owner, repo, issue_number: pull_number }),
        ]);

        const pr = prRes.data;

        return res.status(200).json({
            pr: {
                number: pr.number,
                title: pr.title,
                body: pr.body,
                state: pr.state,
                merged: pr.merged,
                mergeable: pr.mergeable,
                mergeableState: pr.mergeable_state,
                user: pr.user.login,
                userAvatar: pr.user.avatar_url,
                head: pr.head.ref,
                base: pr.base.ref,
                createdAt: pr.created_at,
                additions: pr.additions,
                deletions: pr.deletions,
                changedFilesCount: pr.changed_files,
            },
            files: filesRes.data.map((f) => ({
                filename: f.filename,
                status: f.status, // added, modified, removed
                additions: f.additions,
                deletions: f.deletions,
                patch: f.patch,
            })),
            comments: commentsRes.data.map((c) => ({
                id: c.id,
                user: c.user.login,
                userAvatar: c.user.avatar_url,
                body: c.body,
                createdAt: c.created_at,
            })),
        });
    } catch (err) {
        console.error('Error fetching PR detail:', err);
        return res.status(err.status || 500).json({ error: err.message });
    }
};

/**
 * POST /api/repo/:repo/pulls/:id/merge
 * Merges a pull request given a merge method (merge, squash, rebase).
 */
export const mergePullRequest = async (req, res) => {
    const { repo: repoParam, id: prNumber } = req.params;
    const { mergeMethod = 'merge', commitTitle } = req.body;
    const { owner, repo } = parseRepo(repoParam);

    try {
        const response = await octokit.rest.pulls.merge({
            owner,
            repo,
            pull_number: parseInt(prNumber),
            merge_method: mergeMethod, // 'merge', 'squash', or 'rebase'
            commit_title: commitTitle,
        });

        return res.status(200).json({
            success: true,
            message: response.data.message,
            sha: response.data.sha,
        });
    } catch (err) {
        console.error('Error merging PR:', err);
        return res.status(err.status || 500).json({ error: err.message });
    }
};

export const createManualCicdPr = async (req, res) => {
    const {
        repo: repoParam,
        workflowFilename = 'deploy.yml',
        yamlContent,
        targetBranch = 'ci/manual-setup',
        commitMessage = 'ci: add custom workflow file',
        secrets = [],
    } = req.body;

    if (!repoParam || !yamlContent) {
        return res.status(400).json({ error: 'Missing required repository or YAML content.' });
    }

    const { owner, repo } = parseRepo(repoParam);

    try {
        // 1. Save and Encrypt Repository Secrets if provided
        if (secrets.length > 0) {
            // Ensure sodium WASM initialization completes
            await _sodium.ready;
            const sodium = _sodium;

            // Get public key for secret encryption
            const { data: publicKeyData } = await octokit.rest.actions.getRepoPublicKey({
                owner,
                repo,
            });

            for (const secret of secrets) {
                if (!secret.key || !secret.value) continue;

                // Encrypt secret value using libsodium
                const binKey = sodium.from_base64(publicKeyData.key, sodium.base64_variants.ORIGINAL);
                const binSecret = sodium.from_string(secret.value);
                const encBytes = sodium.crypto_box_seal(binSecret, binKey);
                const encryptedValue = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

                // Put secret into repository
                await octokit.rest.actions.createOrUpdateRepoSecret({
                    owner,
                    repo,
                    secret_name: secret.key.toUpperCase(),
                    encrypted_value: encryptedValue,
                    key_id: publicKeyData.key_id,
                });
            }
        }

        // 2. Get default branch SHA
        const { data: repoInfo } = await octokit.rest.repos.get({ owner, repo });
        const defaultBranch = repoInfo.default_branch;

        const { data: refData } = await octokit.rest.git.getRef({
            owner,
            repo,
            ref: `heads/${defaultBranch}`,
        });

        // 3. Create a new branch (or verify existing branch)
        try {
            await octokit.rest.git.createRef({
                owner,
                repo,
                ref: `refs/heads/${targetBranch}`,
                sha: refData.object.sha,
            });
        } catch (e) {
            // Branch already exists; safely continue
        }

        // 4. Create or update the workflow file in the new branch
        const filePath = `.github/workflows/${workflowFilename.replace(/\.yml$/i, '')}.yml`;

        // Check if file already exists on targetBranch to prevent sha mismatch errors
        let fileSha = undefined;
        try {
            const { data: existingFile } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: filePath,
                ref: targetBranch,
            });
            if (!Array.isArray(existingFile) && existingFile.sha) {
                fileSha = existingFile.sha;
            }
        } catch (e) {
            // File does not exist yet
        }

        await octokit.rest.repos.createOrUpdateFileContents({
            owner,
            repo,
            path: filePath,
            message: commitMessage,
            content: Buffer.from(yamlContent).toString('base64'),
            branch: targetBranch,
            ...(fileSha && { sha: fileSha }), // Pass SHA if updating an existing file
        });

        // 5. Open Pull Request
        const { data: pr } = await octokit.rest.pulls.create({
            owner,
            repo,
            title: commitMessage,
            head: targetBranch,
            base: defaultBranch,
            body: `Automated PR: Adds custom deployment workflow \`${filePath}\` with configured repository secrets.`,
        });

        return res.status(201).json({
            success: true,
            prNumber: pr.number,
            prUrl: pr.html_url,
        });
    } catch (err) {
        console.error('Error in manual CI/CD setup:', err);
        return res.status(err.status || 500).json({ error: err.message });
    }
};