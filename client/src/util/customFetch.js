import { getToken } from './tokenManager'; 

const customFetch = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL || '';
  const url = `${baseURL}${endpoint}`;

  // 1. Grab the token and clean it up immediately
  const rawToken = getToken('artistUser') || getToken('superadminUser') || getToken('adminUser');
  const token = (rawToken && rawToken !== 'null' && rawToken !== 'undefined') ? rawToken : null;

  // 2. Clone headers safely
  const headers = { ...options.headers };

  // 3. Always attach the Authorization header if a token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 4. Safely handle FormData (Files) vs JSON
  // If the body is FormData, delete the Content-Type header to allow multipart/form-data boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  } else if (!headers['Content-Type']) {
    // Default to JSON only if it's not a multipart upload
    headers['Content-Type'] = 'application/json';
  }

  // 5. Execute fetch
  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    return response;
  } catch (error) {
    console.error("CustomFetch Error:", error);
    throw error;
  }
};

export default customFetch;