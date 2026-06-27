import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { MapPin, Phone, User, Package, Truck, Map, ShieldCheck, ArrowLeft, CheckCircle, AlertTriangle, Store } from "lucide-react";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUserArtist } = useSelector((state) => state.artist);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/order/${id}`, {
          headers: { Authorization: `Bearer ${currentUserArtist.token}` },
        });
        const data = await res.json();
        
        if (data.success) {
          setOrder(data.order);
        } else {
          alert(data.message || "Failed to load order");
        }
      } catch (error) {
        alert("Network error while fetching order");
      } finally {
        setLoading(false);
      }
    };

    if (currentUserArtist?.token) fetchOrder();
  }, [id, currentUserArtist]);

  const handleUpdateStatus = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/order/status/${id}`, { 
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserArtist.token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      
      if (data.success) {
        setOrder(prevOrder => ({ ...prevOrder, status: newStatus })); 
        alert(`Success! Order marked as ${newStatus}!`);
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelivery = async () => {
    const confirm = window.confirm("Are you sure you want to confirm delivery? This will release the funds to the artist and cannot be undone.");
    if (!confirm) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/order/${id}/confirm-delivery`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserArtist.token}`,
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setOrder(prevOrder => ({ ...prevOrder, status: 'delivered', escrowStatus: 'released' })); 
        alert("Success! Delivery confirmed and funds released.");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Failed to confirm delivery");
    } finally {
      setUpdating(false);
    }
  };

  const handleDispute = async () => {
    const confirm = window.confirm("Are you sure you want to open a dispute? This will freeze the funds and alert the admin team to investigate.");
    if (!confirm) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/order/${id}/dispute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUserArtist.token}`,
        }
      });
      const data = await res.json();
      
      if (data.success) {
        setOrder(prevOrder => ({ ...prevOrder, escrowStatus: 'disputed' })); 
        alert("Dispute opened. Our admin team will review this shortly.");
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert("Network error while opening dispute");
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-yellow-500 font-black uppercase tracking-widest animate-pulse">
        Decrypting Escrow Details...
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center text-white">
        <p className="text-gray-500 mb-4 font-bold">Order not found.</p>
        <button onClick={() => navigate(-1)} className="text-yellow-500 uppercase font-black text-xs">Go Back</button>
      </div>
    );
  }

  const { deliveryDetails, workId, buyerId, artistId } = order;

  // 🎯 ROLE CHECKS
  const currentUserId = currentUserArtist?._id;
  const isBuyer = currentUserId === (buyerId?._id || buyerId);
  const isArtist = currentUserId === (artistId?._id || artistId);

  return (
    <div className="h-screen overflow-y-auto bg-[#0a0a0a] text-white p-6 md:p-10 pb-32">
      <div className="max-w-3xl mx-auto space-y-6">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 text-gray-400 hover:text-yellow-500 transition-colors uppercase font-black tracking-widest text-[10px]"
        >
          <ArrowLeft size={16} />
          Go Back
        </button>
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-100 flex items-center gap-3">
            <ShieldCheck className="text-yellow-500" size={32} />
            Secure <span className="text-yellow-500">Dispatch</span>
          </h1>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            {isBuyer ? "Track your order and release escrow upon arrival" : "Fulfill this order to unlock your escrow payout"}
          </p>
        </div>

        {/* ARTWORK SUMMARY CARD */}
        <div className="bg-[#0f0f0f] border border-white/10 rounded-[2rem] p-6 shadow-xl flex items-center gap-6">
          <img 
            src={workId?.mediaUrls?.[0]} 
            alt="Artwork" 
            className="w-24 h-24 rounded-2xl object-cover border border-white/10"
          />
          <div className="flex-1">
            <h2 className="text-xl font-black uppercase tracking-tight">{workId?.title}</h2>
            <div className="flex items-center justify-between mt-2">
              <span className="text-yellow-500 font-black text-lg">GHS {order.totalPaidGHS}</span>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                order.escrowStatus === 'disputed' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                order.status === 'delivered' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                order.status === 'shipped' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' :
                'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
              }`}>
                {order.escrowStatus === 'disputed' ? 'DISPUTED' : order.status}
              </span>
            </div>
          </div>
        </div>

        {/* 🆕 ARTIST / SELLER DETAILS (Only visible to the Buyer) */}
        {isBuyer && (
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl space-y-6">
            <h3 className="font-black italic uppercase tracking-tighter text-lg text-slate-300 flex items-center gap-2 border-b border-white/10 pb-4">
              <Store size={20} className="text-yellow-500" /> Dispatch Origin (Artist)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <User className="text-gray-500 mt-1" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Artist Name</p>
                  <p className="font-medium text-white">{artistId?.username || "Unknown Artist"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="text-gray-500 mt-1" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact Info</p>
                  {/* Assumes backend populates email or phone on the artist model */}
                  <p className="font-medium text-white">{artistId?.momoNumber || artistId?.email || "Contact via Yenuvia messages"}</p>
                </div> 
              </div>
            </div>
          </div>
        )}

        {/* DELIVERY DETAILS CARD */}
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 shadow-xl space-y-6">
          <h3 className="font-black italic uppercase tracking-tighter text-lg text-slate-300 flex items-center gap-2 border-b border-white/10 pb-4">
            <Package size={20} className="text-yellow-500" /> Shipping Manifest
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="text-gray-500 mt-1" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Recipient</p>
                  <p className="font-medium text-white">{deliveryDetails?.fullName || buyerId?.username}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="text-gray-500 mt-1" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Contact</p>
                  <p className="font-medium text-white">{deliveryDetails?.phone || "No phone provided"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="text-gray-500 mt-1" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Location</p>
                  <p className="font-medium text-white">{deliveryDetails?.city}, {deliveryDetails?.region}</p>
                  <p className="text-sm text-gray-400 mt-1">{deliveryDetails?.landmark}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Map className="text-gray-500 mt-1" size={18} />
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">GhanaPostGPS</p>
                  <p className="font-black text-yellow-500 tracking-wider">{deliveryDetails?.ghanaPostGps || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 DYNAMIC ESCROW ACTIONS */}
        <div className="pt-4 space-y-4">
          
          {/* STATE: DISPUTED */}
          {order.escrowStatus === 'disputed' && (
             <div className="w-full bg-red-500/10 border border-red-500/20 text-center py-6 rounded-2xl flex flex-col items-center gap-2">
               <AlertTriangle className="text-red-500 mb-2" size={32} />
               <span className="font-black uppercase tracking-widest text-red-500">Order Under Dispute</span>
               <span className="text-xs text-red-400/80 font-bold max-w-sm">Funds are securely frozen. Our administration team is investigating the issue and will be in contact shortly.</span>
             </div>
          )}

          {/* STATE 1: PAID (Awaiting Shipment) */}
          {order.status === 'paid' && order.escrowStatus !== 'disputed' && isArtist && (
             <button 
               onClick={() => handleUpdateStatus('shipped')}
               disabled={updating}
               className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
             >
               <Truck size={20} />
               {updating ? "Updating Server..." : "Mark as Shipped"}
             </button>
          )}
          {order.status === 'paid' && order.escrowStatus !== 'disputed' && isBuyer && (
             <div className="w-full bg-white/5 border border-white/10 text-center py-4 rounded-2xl font-medium text-gray-400">
               Awaiting artist to ship artwork.
             </div>
          )}

          {/* STATE 2: SHIPPED (Awaiting Buyer Confirmation) */}
          {order.status === 'shipped' && order.escrowStatus !== 'disputed' && isBuyer && (
             <div className="flex flex-col gap-3">
               <button 
                 onClick={handleConfirmDelivery}
                 disabled={updating}
                 className="w-full bg-green-500 hover:bg-green-400 text-black py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
               >
                 <CheckCircle size={20} />
                 {updating ? "Processing Escrow..." : "Confirm Delivery & Release Funds"}
               </button>

               <button 
                 onClick={handleDispute}
                 disabled={updating}
                 className="w-full bg-transparent border border-red-500/30 hover:bg-red-500/10 text-red-500 py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50"
               >
                 <AlertTriangle size={20} />
                 {updating ? "Processing..." : "Issue with Order? Open Dispute"}
               </button>
             </div>
          )}
          {order.status === 'shipped' && order.escrowStatus !== 'disputed' && isArtist && (
            <div className="w-full bg-white/5 border border-white/10 text-center py-4 rounded-2xl font-medium text-gray-400">
              Artwork is en route! Awaiting buyer to confirm delivery.
            </div>
          )}

          {/* STATE 3: DELIVERED (Escrow Complete) */}
          {order.status === 'delivered' && order.escrowStatus === 'released' && (
            <div className="w-full bg-green-500/10 border border-green-500/20 text-center py-4 rounded-2xl font-black uppercase tracking-widest text-green-500 flex flex-col items-center gap-1">
              <CheckCircle size={24} />
              <span>Delivered & Funds Released!</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default OrderDetails;