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
        const { data } = await octokit.rest.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 50,
        });

        const repos = data.map((r) => ({
            id: r.id,
            name: r.name,
            fullName: r.full_name,
        }));

        res.json(repos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};