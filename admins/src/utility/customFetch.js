import { getToken } from './tokenManager'; 

const customFetch = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL || '';
  const url = `${baseURL}${endpoint}`;

  // 🛡️ 1. Identify public authentication routes (login, signin, etc.)
  const isAuthRoute = endpoint.includes('/api/auth/');

  // 🛡️ 2. Only look for a token if we are NOT on a login route
  const token = !isAuthRoute 
    ? (getToken('superadminUser') || getToken('adminUser') || getToken('artistUser'))
    : null;

  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // 🚀 3. Bulletproof File handling
  if (options.body instanceof FormData) {
    // If it's a file upload, completely remove Content-Type.
    // The browser must set this automatically with the correct WebKit boundary.
    delete headers['Content-Type'];
  } else if (!headers['Content-Type']) {
    // Default to JSON for standard REST payloads
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export default customFetch;