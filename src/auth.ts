/**
 * PeerLearn Arcade – Auth utilities
 * Wraps the existing /api/auth backend
 */

const API_BASE = "/api/auth";

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: { id: string; email: string; full_name?: string };
}

// ── Token storage ──────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem("pl_access_token");
}

export function setTokens(access: string, refresh: string, expiresAt: number) {
  localStorage.setItem("pl_access_token", access);
  localStorage.setItem("pl_refresh_token", refresh);
  localStorage.setItem("pl_expires_at", String(expiresAt));
}

export function clearTokens() {
  localStorage.removeItem("pl_access_token");
  localStorage.removeItem("pl_refresh_token");
  localStorage.removeItem("pl_expires_at");
}

export function isTokenExpired(): boolean {
  const expiresAt = Number(localStorage.getItem("pl_expires_at") || "0");
  return Date.now() / 1000 > expiresAt - 60; // 60s buffer
}

// ── Auth headers ───────────────────────────────────────────────

export function authHeaders(): HeadersInit {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// ── API Calls ──────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<LoginResult> {
  const res = await fetch(`${API_BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  setTokens(data.access_token, data.refresh_token, data.expires_at);
  return data;
}

export async function signup(
  email: string,
  password: string,
  full_name: string,
  college?: string,
  course?: string
): Promise<{ message: string; user_id: string }> {
  const res = await fetch(`${API_BASE}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, full_name, college, course }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Signup failed");
  return data;
}

export async function getMe(): Promise<{ profile: any } | null> {
  const token = getToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}/me`, {
    headers: authHeaders(),
  });

  if (res.status === 401) {
    clearTokens();
    return null;
  }
  if (!res.ok) return null;
  return res.json();
}

export async function refreshToken(): Promise<boolean> {
  const refresh = localStorage.getItem("pl_refresh_token");
  if (!refresh) return false;

  try {
    const res = await fetch(`${API_BASE}/me`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json();
    setTokens(data.access_token, data.refresh_token, data.expires_at);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

export function logout() {
  clearTokens();
}

// ── Google OAuth ───────────────────────────────────────────────

export async function getGoogleOAuthUrl(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/google`, { method: "GET" });
    const data = await res.json();
    return data.url || null;
  } catch {
    return null;
  }
}
