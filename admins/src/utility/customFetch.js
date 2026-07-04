const customFetch = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL || '';
  const url = `${baseURL}${endpoint}`;

  // 1. Get the token from storage
  const token = localStorage.getItem('token'); 

  // 2. Set up headers, adding the Authorization if a token exists
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers, // Allow individual requests to override/add headers
  };

  // 3. Perform the fetch with the new headers
  return fetch(url, {
    ...options,
    headers,
  });
};

export default customFetch;