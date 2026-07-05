const customFetch = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL || '';
  const url = `${baseURL}${endpoint}`;

  // 1. Prepare Headers
  const headers = { ...options.headers };

  // 2. Bulletproof File handling (Crucial for Admin Image/Work uploads)
  if (options.body instanceof FormData) {
    delete headers['Content-Type']; // Browser handles the boundary automatically
  } else if (!headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  // 3. Execute and return
  // 🔥 The magic line: 'credentials: include' tells the browser to automatically attach the httpOnly cookie!
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', 
  });

  return response;
};

export default customFetch;