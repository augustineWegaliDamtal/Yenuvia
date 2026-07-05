import { getToken } from './tokenManager'; 

const customFetch = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL || '';
  const url = `${baseURL}${endpoint}`;

  // 1. Grab the user's token (Checking artist, admin, and superadmin)
  let token = 
    getToken('artistUser') || 
    getToken('superadminUser') || 
    getToken('adminUser');

  // Scrub out ghost tokens
  if (token === 'null' || token === 'undefined') {
    token = null;
  }

  // 2. Clone headers safely
  const headers = { ...options.headers };

  // 3. Attach the authorization badge! 🛡️
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 4. Safely handle FormData (Files) vs JSON
  if (options.body instanceof FormData) {
    // If uploading files, we MUST NOT set Content-Type. The browser does it.
    delete headers['Content-Type'];
  } else if (!headers['Content-Type']) {
    // Otherwise, default to JSON
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export default customFetch;