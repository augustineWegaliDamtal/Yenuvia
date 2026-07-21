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
  console.log("🚀 Attempting to fetch:", url);
  
  // 🛡️ NEW GLOBAL ERROR HANDLING
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    // 🚨 This catches network crashes (backend sleeping, user loses internet, DNS errors)
    console.error("Yenuvia Network Error intercepted:", error.message);

    // 🛡️ THE SAFETY NET:
    // We return a "fake" response that mimics a real backend error. 
    // This stops React from crashing when your components run `await res.json()`
    return new Response(
      JSON.stringify({
        success: false,
        message: "Connection issue. Please check your internet or try again later.",
      }),
      {
        status: 503, // 503 means Service Unavailable
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export default customFetch;