const customFetch = async (endpoint, options = {}) => {
  const baseURL = import.meta.env.VITE_BACKEND_URL || '';
  const url = `${baseURL}${endpoint}`;

  // 1. Copy over existing headers
  const headers = { ...options.headers };

  // 🛡️ FIX 1: Auto-Stringify Payload Objects
  // If the body is a plain object (and not FormData), convert it to a string automatically.
  // This prevents the dreaded "[object Object]" wire corruption!
  let body = options.body;
  if (body && !(body instanceof FormData) && typeof body === 'object') {
    body = JSON.stringify(body);
    if (!headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
  }

  // 2. Bulletproof File Handling
  if (options.body instanceof FormData) {
    delete headers['Content-Type']; // Let the browser set the boundary wrapper
  } else if (!headers['Content-Type'] && body) {
    headers['Content-Type'] = 'application/json';
  }

  // 🛡️ FIX 2: Optional Header Token Fallback
  // If your backend uses localStorage/Redux tokens instead of cookies, uncomment below:
  /*
  const token = localStorage.getItem('token'); // or pull from your state management
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  */

  // 3. Execute transmission
  const response = await fetch(url, {
    ...options,
    headers,
    body, // Pass our safely processed body string/FormData
    credentials: 'include', 
  });

  // 🛡️ FIX 3: Network Layer Logger
  // This lets you see instantly if a background sync request fails with a 401 or 500 error!
  if (!response.ok) {
    console.error(`❌ [NETWORK ERROR] ${options.method || 'GET'} to ${endpoint} failed with status: ${response.status}`);
  }

  return response;
};

export default customFetch;