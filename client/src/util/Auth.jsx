import jwtDecode from "jwt-decode";

export const getCurrentUserId = () => {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const decoded = jwtDecode(token);
    return decoded.id || decoded._id; // depends on how you signed the token
  } catch (err) {
    console.error("Failed to decode token:", err);
    return null;
  }
};
