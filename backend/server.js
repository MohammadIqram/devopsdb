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

// import routes
import repoRoutes from "./routes/repo.routes.js";
import bugRoutes from "./routes/bug.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import settingsRoutes from "./routes/settings.routes.js";
import userRoutes from "./routes/user.routes.js";

// use routes
app.use("/api/repo", repoRoutes);
app.use("/api/bug", bugRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/user", userRoutes);

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const octokit = new Octokit({ auth: process.env.GITHUB_PAT });
const OWNER = process.env.GITHUB_OWNER; // Your org or username

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === 1) client.send(JSON.stringify(data));
    });
}

// Signature Verification Helper
function verifySignature(req) {
    const signature = req.headers['x-hub-signature-256'];
    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = `sha256=${hmac.update(req.rawBody).digest('hex')}`;
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

const GITHUB_OWNER = process.env.GITHUB_OWNER;

// Endpoint to add a webhook to a selected repo
app.post('/api/webhooks/add', async (req, res) => {
    const { repo, webhookUrl, secret } = req.body;

    if (!repo || !webhookUrl) {
        return res.status(400).json({ error: 'Repository and Webhook URL are required.' });
    }

    try {
        const response = await octokit.rest.repos.createWebhook({
            owner: GITHUB_OWNER,
            repo: repo,
            config: {
                url: webhookUrl,
                content_type: 'json',
                secret: secret || undefined,
                insecure_ssl: '0', // 0 = verify SSL certificate (recommended)
            },
            events: ['workflow_run', 'issues'], // Events you want to listen for
            active: true,
        });

        res.status(200).json({
            message: `Webhook successfully added to ${repo}!`,
            webhookId: response.data.id,
        });
    } catch (error) {
        console.error('Error adding webhook:', error);
        res.status(500).json({
            error: error.response?.data?.message || 'Failed to create webhook.',
        });
    }
});

// WEBHOOK RECEIVER
app.post('/api/webhook', (req, res) => {
    // 1. Verify Request Authenticity
    if (!verifySignature(req)) {
        return res.status(401).send('Invalid signature');
    }

    const event = req.headers['x-github-event'];
    const payload = req.body;

    // 2. Filter relevant events
    if (event === 'workflow_run' || event === 'issues') {
        broadcast({
            type: 'GITHUB_EVENT',
            repo: payload.repository?.name,
            event,
            action: payload.action
        });
    }

    res.status(200).send('Event Received');
});

server.listen(4000, () => console.log('Backend Engine running on http://localhost:4000'));