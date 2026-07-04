import { getToken } from './tokenManager'; 

const customFetch = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL || '';
  const url = `${baseURL}${endpoint}`;

  const token = 
    getToken('superadminUser') || 
    getToken('adminUser') || 
    getToken('artistUser');

  const headers = {
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // 🚀 THE FIX: Only force JSON if we are NOT sending FormData (files)
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  } else if (!options.body && !headers['Content-Type']) {
    // Also default to JSON for GET requests just in case
    headers['Content-Type'] = 'application/json';
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export default customFetch;