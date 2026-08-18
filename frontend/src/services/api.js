/**
 * BLACKBUSER API Client
 * Handles authentication and API calls to the FastAPI backend.
 */

const API_BASE = 'http://localhost:8000';

/**
 * Get stored auth token from localStorage.
 */
function getToken() {
  return localStorage.getItem('access_token');
}

/**
 * Build authorization headers.
 */
function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Handle API response — auto-redirect to login on 401.
 */
async function handleResponse(response) {
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || `API Error: ${response.status}`);
  }
  return response.json();
}

/**
 * Login and store JWT tokens + user profile.
 */
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || 'Invalid credentials');
  }

  const data = await res.json();
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data;
}

/**
 * Logout — clear all stored auth data.
 */
export function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
}

/**
 * Get stored user profile.
 */
export function getStoredUser() {
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

/**
 * Check if user is authenticated.
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Fetch full investor dashboard data.
 */
export async function getDashboard() {
  const res = await fetch(`${API_BASE}/investor/dashboard`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

/**
 * Fetch portfolio history for charts.
 */
export async function getPortfolioHistory() {
  const res = await fetch(`${API_BASE}/investor/portfolio-history`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

/**
 * Fetch price history for a specific stock symbol.
 */
export async function getPriceHistory(symbol) {
  const res = await fetch(`${API_BASE}/investor/price-history/${symbol}`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

/**
 * Fetch current market status.
 */
export async function getMarketStatus() {
  const res = await fetch(`${API_BASE}/investor/market-status`, {
    headers: { ...authHeaders() },
  });
  return handleResponse(res);
}

/**
 * Format a number as INR currency.
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as a percentage with sign.
 */
export function formatPercent(value) {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}
