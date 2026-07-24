import session from "express-session";
import MongoStore from 'connect-mongo';

export const sessionMiddleware = session({
    secret: process.env.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'auth',
        ttl: 24 * 60 * 60
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
    }
});

export const isLoggedIn = async (req, res, next) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized: Please login in first",
            code: "auth:authorized:no_auth",
        });
    }
    next();
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