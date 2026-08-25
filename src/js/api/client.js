// ============================================================
// client.js - 모든 서비스가 공통으로 쓰는 fetch 래퍼
// ============================================================

const TOKEN_STORAGE_KEY = "wc-access-token";

function getToken() {
  return localStorage.getItem(TOKEN_STORAGE_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_STORAGE_KEY, token);
}
function clearToken() {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function apiFetch(baseUrl, path, options = {}) {
  const { method = "GET", body, auth = false, headers = {} } = options;

  const finalHeaders = { ...headers };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";
  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth) {
    clearToken();
  }

  if (res.status === 204) return null;

  let data = null;
  try {
    data = await res.json();
  } catch {
    // 본문 없음
  }

  if (!res.ok) {
    const message = data?.detail || `API 오류: ${res.status}`;
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  return data;
}
