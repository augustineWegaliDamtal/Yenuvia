import { useDispatch } from "react-redux";
import { signoutUserSuccess } from "../redux/user/userSlice";
import { useNavigate } from "react-router-dom";
import { persistor } from "../redux/store"; // 👈 import persistor

const LogoutButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear Redux state
    dispatch(signoutUserSuccess());

    // Purge persisted state (clears localStorage for this slice)
    persistor.purge();

    // Optionally clear cookies if you’re storing JWTs in cookies
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

    // Redirect to signin page
    navigate("/superadmin-signin");
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition mt-6"
    >
      Logout
    </button>
  );
};

export default LogoutButton;
