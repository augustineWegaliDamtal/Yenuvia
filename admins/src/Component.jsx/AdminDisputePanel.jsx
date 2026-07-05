import React, { useState, useEffect } from 'react';
import customFetch from '../utility/customFetch';

const AdminDisputePanel = () => {
  const [disputedOrders, setDisputedOrders] = useState([]);
  const [resolvingId, setResolvingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch the disputes when the panel loads
  const fetchDisputedOrders = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const res = await customFetch('/api/order/all', {
        method: 'GET',
      });
      
      const data = await res.json();
      
      if (res.ok && data.success) {
        // Filter ONLY the ones that are currently disputed
        const activeDisputes = data.orders.filter(order => order.escrowStatus === 'disputed');
        setDisputedOrders(activeDisputes);
      } else {
        setStatusMsg(`⚠️ ${data.message || "Failed to load disputes."}`);
      }
    } catch (err) {
      console.error("Failed to fetch disputes:", err);
      setStatusMsg("⚠️ Failed to load disputes. Please check your network or admin permissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputedOrders();
  }, []);

  // 2. Handle the Admin Decision (Release or Refund)
  const handleResolve = async (orderId, decision) => {
    const confirmation = window.confirm(`Are you sure you want to execute this decision: ${decision.replace('_', ' ')}? This action communicates directly with Paystack and CANNOT be reversed.`);
    if (!confirmation) return;

    setResolvingId(orderId);
    setStatusMsg(''); // Clear previous messages
    
    try {
      const token = localStorage.getItem('token');
      
      const res = await customFetch(`/api/order/${orderId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ decision })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatusMsg(`✅ Success: ${data.message}`);
        fetchDisputedOrders(); // Refresh the list automatically
      } else {
        setStatusMsg(`❌ ${data.message || "Resolution execution failed."}`);
      }
    } catch (err) {
      console.error("Error executing resolution:", err);
      setStatusMsg("❌ Network error. Could not reach server.");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-xl max-w-5xl mx-auto border border-slate-700">
      <div className="mb-6 border-b border-slate-700 pb-4">
        <h2 className="text-2xl font-bold flex items-center gap-2 text-red-400">
          🛡️ Yenuvia Escrow Resolution Center
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Arbitrate marketplace conflicts and release or refund frozen funds directly through the payment gateway.
        </p>
      </div>

      {/* Status Notifications */}
      {statusMsg && (
        <div className={`mb-6 p-4 rounded text-sm font-semibold border ${
          statusMsg.includes('❌') || statusMsg.includes('⚠️') 
            ? 'bg-red-900/50 text-red-200 border-red-700' 
            : 'bg-emerald-900/50 text-emerald-200 border-emerald-700'
        }`}>
          {statusMsg}
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-400 mx-auto mb-3"></div>
          <p className="text-slate-400">Scanning database for frozen transactions...</p>
        </div>
      ) : disputedOrders.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/50 rounded-lg border border-slate-700 border-dashed">
          <p className="text-emerald-400 font-medium text-lg">All clear!</p>
          <p className="text-slate-500 mt-1">There are currently no active escrow disputes requiring your attention.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputedOrders.map((order) => (
            <div key={order._id} className="p-5 bg-slate-800 rounded-lg border border-slate-600 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 hover:border-slate-500 transition-colors">
              
              {/* Order Details */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-red-500/20 text-red-400 text-xs font-bold px-2 py-1 rounded border border-red-500/30 animate-pulse">
                    ACTION REQUIRED
                  </span>
                  <p className="text-xs text-slate-400 font-mono">ID: {order._id}</p>
                </div>
                
                <p className="font-bold text-xl text-white mb-1">
                  Amount Frozen: <span className="text-yellow-400">GHS {order.totalPaidGHS}</span>
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-3 bg-slate-900/50 p-3 rounded border border-slate-700">
                  <div>
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Buyer (Refund Target)</p>
                    <p className="text-sm text-slate-200">{order.buyerId?.username || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Artist (Payout Target)</p>
                    <p className="text-sm text-slate-200">{order.artistId?.username || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3 w-full md:w-48 shrink-0">
                <button
                  onClick={() => handleResolve(order._id, 'release_to_artist')}
                  disabled={resolvingId === order._id}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold py-3 px-4 rounded shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resolvingId === order._id ? 'Processing...' : 'Pay Artist (90%)'}
                </button>
                <button
                  onClick={() => handleResolve(order._id, 'refund_buyer')}
                  disabled={resolvingId === order._id}
                  className="w-full bg-transparent hover:bg-red-900/30 text-red-400 border border-red-500/50 hover:border-red-400 text-sm font-bold py-3 px-4 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resolvingId === order._id ? 'Processing...' : 'Refund Buyer'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDisputePanel;