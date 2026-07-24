import { hostingerClient } from '../lib/hostinger.js';

// Function to get the total count of mailboxes across all mail orders
export const getHostingerMailboxesCount = async () => {
    try {
        // Step 1: Fetch all mail orders
        const ordersRes = await hostingerClient.get('/api/mail/v1/orders');
        const orders = ordersRes.data?.data || ordersRes.data || [];

        if (!Array.isArray(orders) || orders.length === 0) {
            return 0;
        }

        // Step 2: Fetch mailboxes for each order in parallel
        const mailboxPromises = orders.map((order) => {
            const orderId = order.id || order.order_id || order.orderId;
            return hostingerClient.get(`/api/mail/v1/orders/${orderId}/mailboxes`);
        });

        const mailboxResults = await Promise.allSettled(mailboxPromises);

        // Step 3: Sum up total mailboxes across all orders
        let totalMailboxes = 0;

        for (const result of mailboxResults) {
            if (result.status === 'fulfilled') {
                const payload = result.value?.data;

                if (Array.isArray(payload)) {
                    totalMailboxes += payload.length;
                } else if (Array.isArray(payload?.data)) {
                    totalMailboxes += payload.data.length;
                } else if (Array.isArray(payload?.mailboxes)) {
                    totalMailboxes += payload.mailboxes.length;
                }
            } else {
                console.error(
                    'Failed to fetch mailboxes for an order:',
                    result.reason?.response?.data || result.reason?.message
                );
            }
        }

        return totalMailboxes;
    } catch (error) {
        console.error('Error fetching mail orders:', error.response?.data || error.message);
        return 0;
    }
};

// 1. Get all Hosting Accounts / Projects
export const getHostingerProjects = async (req, res) => {
    try {
        const response = await hostingerClient.get('/api/hosting/v1/accounts');
        return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to fetch Hostinger projects',
        });
    }
};

// 2. Get all Registered Domains Portfolio
export const getHostingerDomains = async (req, res) => {
    try {
        const response = await hostingerClient.get('/api/domains/v1/portfolio');
        return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to fetch Hostinger domains',
        });
    }
};

// 3. Get all VPS Virtual Machines
export const getHostingerVPS = async (req, res) => {
    try {
        const response = await hostingerClient.get('/api/vps/v1/virtual-machines');
        return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to fetch Hostinger VPS instances',
        });
    }
};

// 4. Get Business Email Accounts / Mailboxes
export const getHostingerEmails = async (req, res) => {
    try {
        const response = await hostingerClient.get('/api/email/v1/mailboxes');
        return res.status(200).json({ success: true, data: response.data });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to fetch Hostinger email accounts',
        });
    }
};

// 5. Get Dashboard Summary (Aggregates Counts for all Boxes)
export const getHostingerDashboardSummary = async (req, res) => {
    try {
        const [subscriptionsRes, domainsRes, vpsRes, emailsRes] = await Promise.allSettled([
            hostingerClient.get('/api/billing/v1/subscriptions'), // Purchased hosting / plans
            hostingerClient.get('/api/domains/v1/portfolio'),     // Domains
            hostingerClient.get('/api/vps/v1/virtual-machines'),  // VPS instances
            getHostingerMailboxesCount(),                           // Mailboxes aggregator
        ]);

        // Helper function to safely extract array length or total metadata
        const extractCount = (settledResult, fallbackKeys = []) => {
            if (settledResult.status !== 'fulfilled') {
                console.error(
                    'Hostinger API Call Failed:',
                    settledResult.reason?.response?.data || settledResult.reason?.message
                );
                return 0;
            }

            const payload = settledResult.value?.data;
            if (!payload) return 0;

            // Check API meta total or plain numbers
            if (typeof payload?.meta?.total === 'number') return payload.meta.total;
            if (typeof payload?.total === 'number') return payload.total;

            // Check array responses
            if (Array.isArray(payload)) return payload.length;
            if (Array.isArray(payload.data)) return payload.data.length;

            for (const key of fallbackKeys) {
                if (Array.isArray(payload[key])) return payload[key].length;
            }

            return 0;
        };

        // Extract total bought hosting subscriptions
        let projectsCount = 0;
        if (subscriptionsRes.status === 'fulfilled') {
            const rawSubscriptions = subscriptionsRes.value?.data;
            const subList = Array.isArray(rawSubscriptions)
                ? rawSubscriptions
                : Array.isArray(rawSubscriptions?.data)
                    ? rawSubscriptions.data
                    : [];

            // Filter specifically for hosting plans (e.g., Shared, Cloud, Business Hosting)
            projectsCount = subList.filter((sub) => {
                const name = (sub.name || sub.service || '').toLowerCase();
                return name.includes('hosting') || sub.type === 'hosting';
            }).length;

            // If subList items don't explicitly distinguish type, fall back to total subscriptions:
            if (projectsCount === 0 && subList.length > 0) {
                projectsCount = subList.length;
            }
        } else {
            console.error(
                'Subscriptions Call Failed:',
                subscriptionsRes.reason?.response?.data || subscriptionsRes.reason?.message
            );
        }

        const domainsCount = extractCount(domainsRes, ['portfolio', 'domains']);
        const vpsCount = extractCount(vpsRes, ['virtual_machines', 'vps', 'instances']);

        // Extract emails from our helper (already returns a number or settled result)
        const emailsCount =
            typeof emailsRes.value === 'number'
                ? emailsRes.value
                : extractCount(emailsRes, ['mailboxes', 'emails']);

        return res.status(200).json({
            success: true,
            summary: {
                projectsCount, // Total bought hosting plans/subscriptions
                domainsCount,
                vpsCount,
                emailsCount,
            },
        });
    } catch (error) {
        console.error('Summary Endpoint Error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to aggregate Hostinger summary data',
        });
    }
};

export const getAllVps = async (req, res) => {
    try {
        const response = await hostingerClient.get('/api/vps/v1/virtual-machines');
        const rawData = response.data;

        // Standardize dataset array extraction
        const vpsList = Array.isArray(rawData)
            ? rawData
            : Array.isArray(rawData?.data)
                ? rawData.data
                : Array.isArray(rawData?.virtual_machines)
                    ? rawData.virtual_machines
                    : [];

        // Normalize metadata fields for the frontend
        const formattedVps = vpsList.map((vps) => ({
            id: vps.id || vps.vps_id || vps.vpsId,
            name: vps.hostname || vps.name || `VPS-${vps.id}`,
            type: vps.plan || vps.template || vps.type || 'KVM VPS',
            ipAddress: vps.ipv4_address || vps.ip_address || vps.ip || 'N/A',
            status: (vps.status || 'unknown').toLowerCase(),
            expiresAt: vps.expires_at || vps.expiration_date || vps.expiresAt || null,
        }));

        return res.status(200).json({
            success: true,
            count: formattedVps.length,
            data: formattedVps,
        });
    } catch (error) {
        console.error('Error fetching VPS instances:', error.response?.data || error.message);
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve VPS instances from Hostinger API',
            error: error.response?.data || error.message,
        });
    }
};

export const getVpsDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch VPS base details from Hostinger API / Express backend
        const vpsResponse = await hostingerClient.get(`/api/vps/v1/virtual-machines/${id}`);
        const vpsData = vpsResponse.data?.data || vpsResponse.data;

        // Mock / Fetch real metrics for CPU, Memory, Disk, and Network traffic
        const metrics = {
            cpuUsagePercent: 24.5,
            memoryUsedMB: 1840,
            memoryTotalMB: vpsData.memory || 4096,
            diskUsedGB: 18.2,
            diskTotalGB: (vpsData.disk || 51200) / 1024,
            incomingTrafficMbps: 12.4,
            outgoingTrafficMbps: 4.8,
            bandwidthUsedGB: 412,
            bandwidthTotalGB: (vpsData.bandwidth || 4096000) / 1024,
            uptimeSeconds: 1248000, // e.g., 14 days 10 hours
            historicalUsage: [
                { time: '00:00', cpu: 18, memory: 40, incoming: 5, outgoing: 2 },
                { time: '04:00', cpu: 12, memory: 38, incoming: 3, outgoing: 1 },
                { time: '08:00', cpu: 32, memory: 48, incoming: 18, outgoing: 8 },
                { time: '12:00', cpu: 45, memory: 52, incoming: 24, outgoing: 12 },
                { time: '16:00', cpu: 28, memory: 46, incoming: 14, outgoing: 6 },
                { time: '20:00', cpu: 22, memory: 42, incoming: 8, outgoing: 3 },
            ]
        };

        return res.status(200).json({
            success: true,
            data: {
                ...vpsData,
                metrics,
                backup_schedule: 'Daily at 02:00 UTC',
                auto_renewal: true,
                expires_at: '2025-11-02T05:26:30Z',
                server_location: 'Frankfurt, DE (Data Center 13)',
            }
        });
    } catch (error) {
        console.log('error from the getvpsdetails controller: ', error.message);
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to fetch VPS details',
        });
    }
};

/**
 * POST /api/hostinger/vps/:id/reset-password
 * Resets root / SSH password for the VPS
 */
export const resetVpsPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long.',
            });
        }

        // Hostinger API call to update root password
        await hostingerClient.post(`/api/vps/v1/virtual-machines/${id}/root-password`, {
            password: newPassword,
        });

        return res.status(200).json({
            success: true,
            message: 'VPS root password reset successfully!',
        });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Failed to reset password',
        });
    }
};

const generateMetricHistory = (timeframe) => {
    let points = 24;
    let labelFormat;

    switch (timeframe) {
        case '7d':
            points = 7;
            labelFormat = (i) => `Day ${i + 1}`;
            break;
        case '30d':
            points = 30;
            labelFormat = (i) => `Day ${i + 1}`;
            break;
        case '6m':
            points = 6;
            labelFormat = (i) => `Month ${i + 1}`;
            break;
        case '24h':
        default:
            points = 24;
            labelFormat = (i) => `${String(i).padStart(2, '0')}:00`;
            break;
    }

    return Array.from({ length: points }, (_, i) => ({
        timestamp: labelFormat(i),
        cpuUsage: Math.floor(15 + Math.random() * 45), // %
        ramUsage: Math.floor(30 + Math.random() * 40), // %
        ramUsedMB: Math.floor(1200 + Math.random() * 1500),
        diskUsage: Math.floor(35 + (i * 0.1)), // %
        diskUsedGB: Math.floor(17 + (i * 0.05)),
        incomingMbps: Number((2 + Math.random() * 18).toFixed(2)),
        outgoingMbps: Number((1 + Math.random() * 8).toFixed(2)),
    }));
};

/**
 * GET /api/hostinger/vps/:id/health?timeframe=24h
 */
export const getVpsHealthMetrics = async (req, res) => {
    try {
        const { id } = req.params;
        const timeframe = (req.query.timeframe) || '24h';

        const historicalData = generateMetricHistory(timeframe);

        // Current summary snapshot
        const latestSnapshot = historicalData[historicalData.length - 1];

        return res.status(200).json({
            success: true,
            vpsId: id,
            timeframe,
            summary: {
                currentCpu: latestSnapshot.cpuUsage,
                currentRamPercent: latestSnapshot.ramUsage,
                currentRamMB: latestSnapshot.ramUsedMB,
                totalRamMB: 4096,
                currentDiskPercent: Number(latestSnapshot.diskUsage.toFixed(1)),
                currentDiskGB: latestSnapshot.diskUsedGB,
                totalDiskGB: 50,
                incomingMbps: latestSnapshot.incomingMbps,
                outgoingMbps: latestSnapshot.outgoingMbps,
            },
            history: historicalData,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch VPS health metrics',
        });
    }
};