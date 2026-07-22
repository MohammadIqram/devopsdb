export const getProfile = async (req, res) => {
    res.json({
        id: 'usr_1',
        name: 'DevOps Lead',
        email: 'lead@devops.io',
        role: 'Administrator',
        githubHandle: '@devops-lead',
        sshKeyFingerprint: 'SHA256:x89Fm...9aQz',
    });
};

export const updateProfile = async (req, res) => {
    res.json({ message: 'Profile details updated', profile: req.body });
};