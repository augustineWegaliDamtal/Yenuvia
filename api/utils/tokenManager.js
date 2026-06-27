// utils/tokenManager.js

// Save token under a role-specific key
export const saveToken = (roleKey, token) => {
  localStorage.setItem(roleKey, token);
};

// Get token by role key
export const getToken = (roleKey) => {
  return localStorage.getItem(roleKey);
};

// Clear token for a specific role
export const clearToken = (roleKey) => {
  localStorage.removeItem(roleKey);
};

// Clear all tokens (artist, admin, superadmin)
export const clearAllTokens = () => {
  ["artistUser", "adminUser", "superadminUser"].forEach((key) => {
    localStorage.removeItem(key);
  });
};
