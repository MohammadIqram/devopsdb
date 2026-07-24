const clearAuthCookie = (res) => {
    res.clearCookie("devops_session", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
    });
};

export const isLoggedIn = async (req, res, next) => {
    try {
        const token = req.cookies?.devops_session;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "You are not authorized. Please log in.",
            });
        }

        const decoded = await decodeToken(token);

        if (!decoded?.success || !decoded?.data) {
            clearAuthCookie(res);
            return res.status(401).json({
                success: false,
                message: "You don't have a valid session. Please log back in.",
            });
        }
        req.user = decoded.data.payload;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error);
        return res.status(401).json({
            success: false,
            message: "Session expired or invalid token. Please log back in.",
        });
    }
};

export const isAdmin = async (req, res, next) => {
    const isUserAdmin = req.user?.role === "admin" || req.user?.accountType === "admin";

    if (isUserAdmin) return next();

    return res.status(403).json({
        success: false,
        message: "You don't have admin privileges to access this route.",
        code: "route/blocked:no_access_policy__type:isAdmin",
    });
};

export const hasPermission = (permission) => async (req, res, next) => {
    // Fallback: check permissions directly on req.user or req.admin
    const adminPermissions = req.admin?.permissions || req.user?.permissions || [];
    const isRoot = req.admin?.rootAccess || req.user?.rootAccess;
    const isAdminUser = req.user?.accountType === "admin" || req.user?.role === "admin";

    if (isAdminUser && isRoot) {
        return next();
    }

    if (isAdminUser && Array.isArray(adminPermissions) && adminPermissions.includes(permission)) {
        return next();
    }

    return res.status(403).json({
        success: false,
        message: "You do not have access to perform this action.",
    });
};