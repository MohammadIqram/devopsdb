// backend/controllers/settingsController.js
export const getSettings = async (req, res) => {
    res.json({
        autoDeployStaging: true,
        slackNotifications: true,
        webhookSecret: '••••••••••••••••',
        logRetentionDays: 30,
    });
};

export const updateSettings = async (req, res) => {
    res.json({ message: 'Settings successfully saved', settings: req.body });
};