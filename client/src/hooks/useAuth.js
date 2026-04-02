import { useState, useEffect } from 'react';
import { apiFetch, setToken, clearToken } from '../api/client.js';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jta_token');
    if (!token) {
      setLoading(false);
      return;
    }
    apiFetch('/user/me')
      .then(data => setUser(data.user))
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

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
