import React, { useEffect, Suspense, lazy } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useSocket } from "./context/SocketContext"; 
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom';
import { XCircle, CheckCircle } from "lucide-react";

import Layout from './components/Layout'; 
import AppLayout from './pages/AppLayout'; 
import { 
  INCREMENT_UNREAD_MESSAGE, 
  SET_LIVE_ALERT 
} from "./redux/users/notificationsSlice";

import { updateVerificationStatus } from "./redux/users/artistSlice"; 

import WorkDetail from "./pages/WorkDetail";
import OrderDetails from "./pages/OrderDetails";
import Wallet from "./components/Wallet";
import Vault from "./pages/Vault";
import Terms from "./pages/Terms";
import RequireAuth from "./components/RequireAuth";

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Signin = lazy(() => import('./pages/Signin'));
const Signup = lazy(() => import('./pages/Signup'));
const Profile = lazy(() => import('./pages/Profile'));
const Inbox = lazy(() => import('./pages/Inbox'));
const Uploads = lazy(() => import('./pages/Uploads'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));

const ArenaLoader = () => (
  <div className="h-screen bg-black flex flex-col items-center justify-center">
    <div className="w-12 h-12 border-t-2 border-b-2 border-yellow-500 rounded-full animate-spin mb-4" />
    <p className="text-yellow-500 font-black italic uppercase text-[10px] tracking-[0.3em] animate-pulse">
      Yenuvia Syncing...
    </p>
  </div>
);

const App = () => {
  const { currentUserArtist } = useSelector((state) => state.artist);
  const dispatch = useDispatch();
  
  const socket = useSocket();

  useEffect(() => {
    if (!currentUserArtist?._id || !socket) return;

    const handleReceiveMessage = (message) => {
      const senderId = message.sender?._id || message.sender;
      if (senderId && senderId !== currentUserArtist._id) {
        dispatch(INCREMENT_UNREAD_MESSAGE()); 
      }
    };

    const handleWorkApproved = (data) => {
      dispatch(SET_LIVE_ALERT({
        type: 'success',
        title: 'Masterpiece Live!',
        message: data?.message || "Transmission received."
      }));
    };

    const handleWorkRejected = (data) => {
      dispatch(SET_LIVE_ALERT({
        type: 'error',
        title: 'Arena Feedback',
        message: data?.message || "Signal rejected."
      }));
    };

    const handleVerificationChange = (data) => {
      console.log("🌍 GLOBAL LISTENER: Verification change detected!", data);
      
      if (currentUserArtist._id === data.artistId) {
        console.log(`✅ It's us! Updating Redux global state to verified: ${data.verified}`);
        dispatch(updateVerificationStatus(data.verified));
      }
    };

    socket.on("receiveMessage", handleReceiveMessage);
    socket.on("work_approved", handleWorkApproved);
    socket.on("work_rejected", handleWorkRejected);
    socket.on("artist_verification_updated", handleVerificationChange);

    return () => {
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off("work_approved", handleWorkApproved);
      socket.off("work_rejected", handleWorkRejected);
      socket.off("artist_verification_updated", handleVerificationChange); 
    };
  }, [currentUserArtist?._id, dispatch, socket]); 

  return (
    <div className="flex items-center justify-center min-h-[100dvh] bg-[#050505]">
      
      {/* THE PERFECT DUAL-EXPERIENCE WRAPPER */}
      <div className="w-full h-[100dvh] md:w-[400px] md:h-[850px] md:rounded-[40px] md:border-[8px] md:border-zinc-900 bg-black relative shadow-[0_0_50px_rgba(234,179,8,0.1)] overflow-hidden md:[transform:translateZ(0)]">
        <BrowserRouter>
          <Suspense fallback={<ArenaLoader />}>
            <Routes>
              <Route path="/" element={<AppLayout><Layout /></AppLayout>} />
              <Route path="/home" element={<AppLayout><Home /></AppLayout>} />
              <Route path="/profile" element={
                <RequireAuth><AppLayout><Profile /></AppLayout></RequireAuth>
              } />
              <Route path="/profile/:id" element={<AppLayout><Profile /></AppLayout>} /> 
              <Route path="/artist/:id" element={<AppLayout><Profile /></AppLayout>} />
              <Route path="/inbox" element={
                <RequireAuth><AppLayout><Inbox /></AppLayout></RequireAuth>
              } />
              <Route path="/uploads" element={
                <RequireAuth><AppLayout><Uploads /></AppLayout></RequireAuth>
              } />
              

              <Route path="/about" element={<About />} />
              <Route path="/signin" element={<Signin />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/order/verify" element={<PaymentSuccess />} />
              <Route path="/wallet" element={<Wallet />} />
              <Route path="/work/:id" element={<WorkDetail />} />
              <Route path="/order/:id" element={<OrderDetails />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/terms" element={<Terms />} />
              
              <Route path="/payment-failed" element={
                <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-10 text-center">
                  <XCircle size={64} className="text-red-500 mb-4" />
                  <h1 className="text-white text-2xl font-black uppercase italic">Payment Cancelled</h1>
                  <p className="text-gray-500 text-sm mt-2">No worries! Your account wasn't charged. You can try again whenever you're ready.</p>
                  <Link to="/" className="mt-8 bg-white text-black px-8 py-3 rounded-full font-bold uppercase text-xs">Back to Feed</Link>
                </div>
              } />

              <Route path="/payment-success" element={
                <div className="h-screen w-full bg-black flex flex-col items-center justify-center p-10 text-center">
                  <CheckCircle size={64} className="text-green-500 mb-4" />
                  <h1 className="text-white text-2xl font-black uppercase italic">Welcome to Pro</h1>
                  <p className="text-gray-500 text-sm mt-2">Your legacy is now secured. The Golden Checkmark is yours.</p>
                  <Link to="/" className="mt-8 bg-yellow-500 text-black px-8 py-3 rounded-full font-bold uppercase text-xs">Enter Yenuvia</Link>
                </div>
              } />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </div>
      
    </div>
  );
};

export default App;