import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Phone, User, Navigation, CreditCard, Loader2 } from "lucide-react";
import { useSelector } from "react-redux";
import customFetch from "../util/customFetch.js";

const CheckoutModal = ({ isOpen, onClose, work }) => {
  const { currentUserArtist } = useSelector((state) => state.artist);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [deliveryDetails, setDeliveryDetails] = useState({
    fullName: currentUserArtist?.username || "",
    phone: "",
    ghanaPostGps: "",
    landmark: "",
    city: "Accra",
    region: "Greater Accra",
  });

  const handleCheckout = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await customFetch("/api/order/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserArtist?.token}`,
        },
        body: JSON.stringify({
          workId: work._id,
          deliveryDetails,
        }),
      });

      const data = await res.json();

      if (data.success && data.url) {
        // 🚀 THE REDIRECT: Send user to Paystack's Secure MoMo Page
        window.location.href = data.url;
      } else {
        setError(data.message || "Checkout failed. Please try again.");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Check your connection.");
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* OVERLAY */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
          />

          {/* MODAL */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-950 border-t border-white/10 rounded-t-[3rem] z-[70] p-8 pb-12 shadow-2xl"
          >
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Secure <span className="text-yellow-500">Checkout</span></h2>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Acquiring: {work.title}</p>
              </div>
              <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCheckout} className="space-y-4">
              {/* CONTACT INFO */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                  <label className="text-[8px] font-black text-zinc-500 uppercase flex items-center gap-1 mb-1"><User size={10}/> Receiver</label>
                  <input 
                    type="text" required placeholder="Full Name"
                    className="bg-transparent w-full outline-none text-sm font-bold"
                    value={deliveryDetails.fullName}
                    onChange={(e) => setDeliveryDetails({...deliveryDetails, fullName: e.target.value})}
                  />
                </div>
                <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                  <label className="text-[8px] font-black text-zinc-500 uppercase flex items-center gap-1 mb-1"><Phone size={10}/> Phone</label>
                  <input 
                    type="tel" required placeholder="024xxxxxxx"
                    className="bg-transparent w-full outline-none text-sm font-bold text-yellow-500"
                    onChange={(e) => setDeliveryDetails({...deliveryDetails, phone: e.target.value})}
                  />
                </div>
              </div>

              {/* GHANA POST GPS */}
              <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/10 flex items-center gap-3">
                <Navigation size={20} className="text-yellow-500" />
                <div className="flex-1">
                  <label className="text-[8px] font-black text-zinc-500 uppercase">GhanaPost GPS Address</label>
                  <input 
                    type="text" required placeholder="GA-123-4567"
                    className="bg-transparent w-full outline-none text-lg font-black uppercase placeholder:text-zinc-700"
                    onChange={(e) => setDeliveryDetails({...deliveryDetails, ghanaPostGps: e.target.value})}
                  />
                </div>
              </div>

              {/* LANDMARK */}
              <div className="bg-zinc-900/50 p-4 rounded-2xl border border-white/5">
                <label className="text-[8px] font-black text-zinc-500 uppercase flex items-center gap-1 mb-1"><MapPin size={10}/> Landmark Description</label>
                <textarea 
                  required placeholder="e.g. Blue building opposite the Total station..."
                  className="bg-transparent w-full outline-none text-xs font-bold h-16 resize-none"
                  onChange={(e) => setDeliveryDetails({...deliveryDetails, landmark: e.target.value})}
                />
              </div>

              {/* PRICE SUMMARY */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black text-zinc-500 uppercase">Total Amount</p>
                  <p className="text-2xl font-black italic text-white">GHS {work.price?.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[8px] font-black text-green-500 uppercase bg-green-500/10 px-2 py-1 rounded-md">Secured by Paystack</p>
                </div>
              </div>

              {error && <p className="text-red-500 text-[9px] font-black uppercase text-center">{error}</p>}

              <button 
        type="submit" 
        disabled={loading}
        className="w-full bg-yellow-500 text-black py-5 rounded-[2rem] font-black uppercase tracking-[0.2em] text-xs shadow-[0_10px_30px_rgba(234,179,8,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 mb-10"
      >
        {loading ? <Loader2 className="animate-spin" size={18} /> : <><CreditCard size={18}/> Pay with MoMo</>}
      </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CheckoutModal;