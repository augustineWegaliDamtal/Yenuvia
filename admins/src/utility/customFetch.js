// client/src/api/utils/customFetch.js

const customFetch = async (endpoint, options = {}) => {
  // Automatically fallback to empty string if running locally with a proxy
  const baseURL = import.meta.env.VITE_BACKEND_URL || '';
  
  // Combine them cleanly
  const url = `${baseURL}${endpoint}`;

  return fetch(url, options);
};

export default customFetch;