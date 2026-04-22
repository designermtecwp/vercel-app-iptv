const API_URL = 'http://135.181.202.12/api';

export async function getAppConfig() {
  const res = await fetch(`${API_URL}/app/config`, { cache: 'no-store' });
  return res.json();
}

export async function login(username, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  return { data: await res.json(), ok: res.ok };
}

export async function getChannels(token, password) {
  const res = await fetch(`${API_URL}/channels`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Password': password,
    },
  });
  return res.json();
}
