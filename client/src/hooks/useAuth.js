import { useState, useEffect } from 'react';
import { apiFetch, setToken, clearToken } from '../api/client.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jta_token');
    if (token) {
      apiFetch('/user/me')
        .then(data => setUser(data.user))
        .catch(() => {
          clearToken();
          autoDemoLogin().then(setUser).finally(() => setLoading(false));
        })
        .finally(() => setLoading(false));
    } else {
      autoDemoLogin().then(setUser).finally(() => setLoading(false));
    }
  }, []);

  async function autoDemoLogin() {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const payload = btoa(JSON.stringify({ sub: `dev-${Date.now()}`, plan_type: 'basic' }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const fincsToken = `${header}.${payload}.devsig`;
    const data = await apiFetch('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ fincsToken }),
    });
    setToken(data.token);
    return data.user;
  }

  async function login(fincsToken) {
    const data = await apiFetch('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ fincsToken }),
    });
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    clearToken();
    setUser(null);
  }

  return { user, loading, login, logout };
}
