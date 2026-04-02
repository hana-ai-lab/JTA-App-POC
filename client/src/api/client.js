const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('jta_token');
}

export function setToken(token) {
  localStorage.setItem('jta_token', token);
}

export function clearToken() {
  localStorage.removeItem('jta_token');
}

export async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
}
