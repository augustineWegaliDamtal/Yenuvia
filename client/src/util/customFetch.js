const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

const customFetch = async (endpoint, options = {}) => {
  options.headers = options.headers || {};

  // 🛡️ CRITICAL: Tell the browser to include the HttpOnly auth cookie automatically
  options.credentials = "include";

  // Automatically set Content-Type for JSON payloads (without breaking multipart FormData for images/videos)
  if (options.body && !(options.body instanceof FormData)) {
    if (!options.headers["Content-Type"]) {
      options.headers["Content-Type"] = "application/json";
    }
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BACKEND_URL}${endpoint}`;
  
  const response = await fetch(url, options);
  return response;
};

export default customFetch;