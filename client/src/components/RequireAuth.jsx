import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';

const RequireAuth = ({ children }) => {
  // Check if any user type is currently logged in
  const activeUser = useSelector((state) => 
    state.user?.currentUser || 
    state.artist?.currentUserArtist || 
    state.admin?.currentUser
  );
  
  const location = useLocation();

  if (!activeUser) {
    // Redirect to signin, but save the location they were trying to go to!
    // This allows you to redirect them BACK to the upload page after they finish signing in.
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If logged in, render the protected component
  return children;
};

export default RequireAuth;