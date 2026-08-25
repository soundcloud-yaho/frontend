// ============================================================
// auth.js
// ============================================================

async function registerUser(form) {
  return apiFetch(CONFIG.AUTH_BASE_URL, "/auth/register", { method: "POST", body: form });
}

async function loginUser(form) {
  return apiFetch(CONFIG.AUTH_BASE_URL, "/auth/login", { method: "POST", body: form });
}

async function fetchMe() {
  return apiFetch(CONFIG.AUTH_BASE_URL, "/auth/me", { auth: true });
}

function logoutUser() {
  clearToken();
}
