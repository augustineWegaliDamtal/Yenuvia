import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Wallet as WalletIcon, ArrowUpRight, History, CheckCircle2, Clock, XCircle, Loader2, Landmark } from "lucide-react";

const Wallet = () => {
  const activeUser = useSelector((state) => state.user?.currentUser || state.artist?.currentUserArtist);
  
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("HISTORY"); // "HISTORY" or "CASHOUT"

  // Cashout Form State
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [network, setNetwork] = useState("MTN");
  const [phone, setPhone] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users/wallet", {
        headers: { Authorization: `Bearer ${activeUser?.token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setBalance(data.balance);
        setHistory(data.history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleCashout = async (e) => {
    e.preventDefault();
    if (withdrawAmount > balance) return alert("Insufficient funds!");
    if (withdrawAmount < 10) return alert("Minimum cashout is GHS 10");

    setIsWithdrawing(true);
    // TODO: Connect this to your future withdrawal backend route
    setTimeout(() => {
      alert(`Withdrawal request of GHS ${withdrawAmount} sent to ${network} - ${phone}. Pending Admin approval.`);
      setIsWithdrawing(false);
      setWithdrawAmount("");
      setPhone("");
      setActiveTab("HISTORY");
    }, 1500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#050505]"><Loader2 className="animate-spin text-yellow-500" size={40} /></div>;

  return (
    <div className="bg-[#050505] min-h-screen pb-24 text-white font-sans animate-fade-in p-4 lg:p-8">
      <div className="max-w-3xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-yellow-500/10 p-3 rounded-2xl border border-yellow-500/20">
            <WalletIcon className="text-yellow-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">My Vault</h1>
            <p className="text-[10px] font-bold tracking-widest text-zinc-500 uppercase">Manage your dividends</p>
          </div>
        </div>

        {/* BALANCE CARD */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/10 rounded-[2rem] p-8 mb-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[50px] rounded-full" />
          
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Available Balance</p>
          <div className="flex items-baseline gap-2 mb-6">
            <span className="text-2xl font-bold text-zinc-400">GHS</span>
            <span className="text-5xl font-black tracking-tighter">{balance.toFixed(2)}</span>
          </div>

          <button 
            onClick={() => setActiveTab("CASHOUT")}
            className="bg-yellow-500 hover:bg-yellow-400 text-black px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
          >
            Request Cashout <ArrowUpRight size={16} />
          </button>
        </div>

        {/* TABS */}
        <div className="flex gap-4 mb-6 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab("HISTORY")}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all pb-2 border-b-2 ${activeTab === "HISTORY" ? "border-yellow-500 text-yellow-500" : "border-transparent text-zinc-500"}`}
          >
            <History size={14} /> Activity Log
          </button>
          <button 
            onClick={() => setActiveTab("CASHOUT")}
            className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all pb-2 border-b-2 ${activeTab === "CASHOUT" ? "border-yellow-500 text-yellow-500" : "border-transparent text-zinc-500"}`}
          >
            <Landmark size={14} /> Withdraw Funds
          </button>
        </div>

        {/* TAB CONTENT: HISTORY */}
        {activeTab === "HISTORY" && (
          <div className="space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-10 bg-black border border-white/5 rounded-3xl">
                <p className="text-zinc-600 font-black text-[11px] uppercase tracking-widest">No transactions yet.</p>
              </div>
            ) : (
              history.map((record) => (
                <div key={record._id} className="bg-[#0a0a0a] border border-white/5 p-4 rounded-2xl flex items-center justify-between group hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Status Icon */}
                    {record.status === "WON" && <CheckCircle2 className="text-green-500" size={20} />}
                    {record.status === "PENDING" && <Clock className="text-yellow-500" size={20} />}
                    {record.status === "LOST" && <XCircle className="text-red-500" size={20} />}
                    
                    <div>
                      <p className="text-xs font-bold text-white mb-0.5 max-w-[200px] truncate">
                        {record.matchId?.directive || "Derby Pledge"}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                        {new Date(record.createdAt).toLocaleDateString()} • {record.status}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    {record.status === "WON" ? (
                      <p className="text-green-500 font-black text-sm">+ GHS {record.payoutAmount?.toFixed(2)}</p>
                    ) : record.status === "PENDING" ? (
                      <p className="text-yellow-500 font-black text-sm">GHS {record.amount?.toFixed(2)}</p>
                    ) : (
                      <p className="text-red-500 font-black text-sm line-through opacity-50">GHS {record.amount?.toFixed(2)}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB CONTENT: CASHOUT FORM */}
        {activeTab === "CASHOUT" && (
          <form onSubmit={handleCashout} className="bg-[#0a0a0a] border border-white/5 p-6 rounded-[2rem]">
            <div className="mb-6">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Amount to Withdraw (GHS)</label>
              <input 
                type="number" 
                required
                min="10"
                max={balance}
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-lg font-bold outline-none focus:border-yellow-500 transition-colors"
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Network</label>
                <select 
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-[11px] font-black uppercase outline-none focus:border-yellow-500"
                >
                  <option value="MTN">MTN MoMo</option>
                  <option value="TELECEL">Telecel Cash</option>
                  <option value="AT">AT Money</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-black border border-white/10 rounded-xl p-4 text-white text-sm font-bold outline-none focus:border-yellow-500 transition-colors"
                  placeholder="054 XXX XXXX"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isWithdrawing || balance < 10}
              className="w-full bg-white text-black py-4 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-30 disabled:active:scale-100 flex justify-center items-center gap-2"
            >
              {isWithdrawing ? <Loader2 className="animate-spin" size={16} /> : "Confirm Transfer"}
            </button>
            <p className="text-center text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-4">Transfers are processed within 24 hours.</p>
          </form>
        )}

      </div>
    </div>
  );
};

export default Wallet;