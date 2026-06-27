import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHouse, faPlus, faEnvelope, faUser } from '@fortawesome/free-solid-svg-icons';
import { CLEAR_UNREAD_MESSAGES } from '../redux/users/notificationsSlice';
import InstallApp from './InstallApp';

const BottomNav = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  
  const { currentUserArtist } = useSelector((state) => state.artist);
  const { unreadMessageCount } = useSelector((state) => state.notifications);

  const navItems = [
    { label: 'Home', path: '/home', icon: faHouse },
    { label: 'Inbox', path: '/inbox', icon: faEnvelope },
    { label: 'Upload', path: '/uploads', icon: faPlus },
  ];

  return (
    <>
      {/* 🔥 THE FLOATING PWA BANNER - Lowered to match the new nav height */}
      <div className="fixed bottom-[70px] left-0 right-0 px-4 z-[90] flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <InstallApp />
        </div>
      </div>

      {/* 🚀 THE SLEEK NAVIGATION BAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-lg text-white flex justify-around items-center 
        h-[60px]       /* Tighter Mobile height (Industry Standard) */
        md:h-14        /* Even slimmer on laptops */
        pb-1           /* Reduced bottom padding */
        md:pb-0 
        border-t border-white/5 z-[100]"
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const isInbox = item.label === 'Inbox';
          const isUpload = item.label === 'Upload';

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => {
                if (isInbox) {
                  dispatch(CLEAR_UNREAD_MESSAGES());
                }
              }}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-yellow-500 scale-105' : 'text-gray-500 hover:text-gray-300'
              } relative`}
            >
              {/* Reduced the Upload button bulge and padding */}
              <div className={`relative ${isUpload ? 'bg-yellow-500 text-black p-2.5 rounded-[1rem] shadow-[0_0_15px_#eab308] -mt-2' : ''}`}>
                <FontAwesomeIcon icon={item.icon} className={isUpload ? 'text-xl' : 'text-lg'} />
                
                {/* 🔴 Inbox Badge */}
                {isInbox && unreadMessageCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[9px] font-black rounded-full h-4 w-4 flex items-center justify-center border-2 border-black animate-bounce">
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </span>
                )}
              </div>
              
              {!isUpload && (
                <span className="text-[8px] font-black uppercase tracking-widest leading-none mt-0.5">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}

        {/* ✅ Profile/Signin Section */}
        {currentUserArtist ? (
          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              location.pathname === '/profile' ? 'text-yellow-500 scale-105' : 'text-gray-500'
            }`}
          >
            {/* Shrunk the profile picture slightly */}
            <img
              className={`w-6 h-6 rounded-full object-cover border-2 ${
                location.pathname === '/profile' ? 'border-yellow-500' : 'border-white/10'
              }`}
              alt="Profile"
              src={currentUserArtist.avatar || '/default-avatar.png'}
            />
            <span className="text-[8px] font-black uppercase tracking-widest leading-none mt-0.5">Profile</span>
          </Link>
        ) : (
          <Link
            to="/signin"
            className="flex flex-col items-center gap-1 text-gray-500 hover:text-white"
          >
            <FontAwesomeIcon icon={faUser} className="text-lg" />
            <span className="text-[8px] font-black uppercase tracking-widest leading-none mt-0.5">Signin</span>
          </Link>
        )}
      </nav>
    </>
  );
};

export default BottomNav;