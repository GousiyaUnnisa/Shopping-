const API_BASE = "https://shopping-backend-y7x7.onrender.com";

export async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed: ${res.status} ${text}`);
  }
  return res.json();
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed: ${res.status} ${text}`);
  }

  return res.json();
}
