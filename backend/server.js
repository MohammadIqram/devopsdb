// backend/server.js
const express = require('express');
const { Octokit } = require('@octokit/rest');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });
const OWNER = process.env.GITHUB_OWNER;
const REPO = process.env.GITHUB_REPO;

// Helper: Broadcast Webhooks/Updates to Next.js clients via WebSockets
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(JSON.stringify(data));
    });
}

// ------------------------------------------------------------------
// 1. ENDPOINT: Trigger Deployment
// ------------------------------------------------------------------
app.post('/api/deploy', async (req, res) => {
    const { environment, ref = 'main', user } = req.body;

    try {
        await octokit.rest.repos.createDispatchEvent({
            owner: OWNER,
            repo: REPO,
            event_type: 'custom_deploy_trigger',
            client_payload: { environment, deployed_by: user || 'Dashboard User' },
        });

        res.status(200).json({ success: true, message: `Deployment triggered for ${environment}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ------------------------------------------------------------------
// 2. ENDPOINT: Get Latest Workflow Runs
// ------------------------------------------------------------------
app.get('/api/deployments', async (req, res) => {
    try {
        const { data } = await octokit.rest.actions.listWorkflowRunsForRepo({
            owner: OWNER,
            repo: REPO,
            per_page: 5,
        });

        const runs = data.workflow_runs.map((run) => ({
            id: run.id,
            name: run.name,
            status: run.status,       // e.g., 'in_progress', 'completed'
            conclusion: run.conclusion, // e.g., 'success', 'failure'
            branch: run.head_branch,
            commit: run.head_commit?.message || 'N/A',
            url: run.html_url,
            createdAt: run.created_at,
        }));

        res.json(runs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ------------------------------------------------------------------
// 3. ENDPOINT: Get Logs for a Workflow Job
// ------------------------------------------------------------------
app.get('/api/logs/:jobId', async (req, res) => {
    try {
        const response = await octokit.rest.actions.downloadJobLogsForWorkflowRun({
            owner: OWNER,
            repo: REPO,
            job_id: req.params.jobId,
        });

        res.set('Content-Type', 'text/plain');
        res.send(response.data);
    } catch (error) {
        res.status(500).send('Unable to download job log archive from GitHub.');
    }
});

// ------------------------------------------------------------------
// 4. ENDPOINT: Fetch Open Critical Bugs
// ------------------------------------------------------------------
app.get('/api/bugs', async (req, res) => {
    try {
        const { data: issues } = await octokit.rest.issues.listForRepo({
            owner: OWNER,
            repo: REPO,
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
});

// ------------------------------------------------------------------
// 5. GITHUB WEBHOOK RECEIVER (Real-time Updates)
// ------------------------------------------------------------------
app.post('/api/webhook', (req, res) => {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    if (event === 'workflow_run' || event === 'issues') {
        // Notify all Next.js clients to refetch data immediately
        broadcast({ type: 'GITHUB_EVENT', event, action: payload.action });
    }

    res.status(200).send('Event Received');
});

server.listen(4000, () => console.log('Backend Engine running on http://localhost:4000'));