import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("bcmrv_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            const hadToken = localStorage.getItem("bcmrv_token");
            if (hadToken) {
                localStorage.removeItem("bcmrv_token");
                localStorage.removeItem("bcmrv_user");
                localStorage.removeItem("bcmrv_login_at");
                if (window.location.pathname !== "/") {
                    window.location.href = "/";
                }
            }

        }
        return Promise.reject(err);
    }
);

export const authAPI = {
    register: (data) => api.post("/auth/register", data),

    loginWallet: (walletAddress, signature, message) =>
        api.post("/auth/login-wallet", { walletAddress, signature, message }),
    loginDemo: (role) => api.post("/auth/demo-login", { role }),
    getMe: () => api.get("/auth/me"),
};

export const projectsAPI = {
    getAll: (params) => api.get("/projects", { params }),
    getPublic: () => api.get("/projects/public"),
    getById: (id) => api.get(`/projects/${id}`),
    create: (data) => api.post("/projects", data),
    update: (id, data) => api.patch(`/projects/${id}`, data),
};

export const submissionsAPI = {
    create: (data) => api.post("/submissions", data),
    getMy: () => api.get("/submissions/my"),
    getById: (id) => api.get(`/submissions/${id}`),
};

export const verificationsAPI = {
    getQueue: () => api.get("/verifications/queue"),
    review: (submissionId, data) =>
        api.post(`/verifications/${submissionId}/review`, data),
    getHistory: () => api.get("/verifications/history"),
};

export const adminAPI = {
    getUsers: () => api.get("/admin/users"),
    createStaffUser: (data) => api.post("/admin/users", data),
    updateRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
    assignProject: (userId, data) =>
        api.patch(`/admin/users/${userId}/assign-project`, data),
    getMintQueue: () => api.get("/admin/mint-queue"),
    mint: (projectId) => api.post(`/admin/mint/${projectId}`),
};

export const reportsAPI = {
    getDashboardStats: () => api.get("/reports/dashboard-stats"),
    exportCSV: (projectId) =>
        api.get("/reports/export-csv", { params: { projectId }, responseType: "blob" }),
    getNDC: () => api.get("/reports/ndc"),
    getLedger: () => api.get("/reports/ledger"),
    getPerformance: () => api.get("/reports/performance"),
    getAuditLogs: () => api.get("/reports/audit-logs"),
    getUserCredits: () => api.get("/reports/user-credits"),
};

export const settingsAPI = {
    getFormula: () => api.get("/settings/formula"),
    updateFormula: (data) => api.patch("/settings/formula", data),
};

export default api;
