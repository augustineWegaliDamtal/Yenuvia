// Adjust this import path so it correctly points to your tokenManager.js file
import { getToken } from './tokenManager'; 

const customFetch = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL || '';
  const url = `${baseURL}${endpoint}`;

  // Cascade through your roles to find whichever token is currently active
  const token = 
    getToken('superadminUser') || 
    getToken('adminUser') || 
    getToken('artistUser');

  const headers = {
    'Content-Type': 'application/json',
    // If a token was found, attach it. Otherwise, do nothing.
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
};

export default customFetch;