export const getUsers = async (req, res) => {
    // 1. Get all team users
    res.json([
        { id: 'usr_1', name: 'Alex Rivera', email: 'alex@devops.io', role: 'DevOps Lead', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex' },
        { id: 'usr_2', name: 'Sam Chen', email: 'sam@devops.io', role: 'Backend Dev', status: 'Active', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
        { id: 'usr_3', name: 'Jordan Lee', email: 'jordan@devops.io', role: 'SRE Specialist', status: 'Pending', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jordan' },
    ]);
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