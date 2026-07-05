import { getToken } from './tokenManager'; 

const customFetch = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL || '';
  const url = `${baseURL}${endpoint}`;

  // 1. Identify the token regardless of route 
  // (Let the backend's verifyToken middleware handle the 'unauthorized' logic)
  const rawToken = getToken('superadminUser') || getToken('adminUser') || getToken('artistUser');
  const token = (rawToken && rawToken !== 'null' && rawToken !== 'undefined') ? rawToken : null;

  // 2. Prepare Headers
  const headers = { ...options.headers };

  // 3. Always attach the Authorization header if a token is present
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 4. Bulletproof File handling (Crucial for Admin Image/Work uploads)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']; // Browser handles the boundary automatically
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // 5. Execute and return
  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};

export default customFetch;