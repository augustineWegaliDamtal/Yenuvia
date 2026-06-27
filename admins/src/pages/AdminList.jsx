import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminList = () => {
  const { currentUser } = useSelector((state) => state.admin || {});
  
  const [admins, setAdmins] = useState([]);
  const [counts, setCounts] = useState({ admins: 0, superadmins: 0, artists: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAdmin, setEditingAdmin] = useState(null);

  // --- Fetch users ---
  useEffect(() => {
    const fetchAdmins = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/admin", {
          headers: { Authorization: `Bearer ${currentUser?.token}` },
        });
        const data = await res.json();

        if (data.success) {
          const userList = data.users || data.admins || [];
          setAdmins(userList);
          setCounts({
            admins: data.adminsCount || data.counts?.admins || 0,
            superadmins: data.superadminsCount || data.counts?.superadmins || 0,
            artists: data.artistsCount || data.counts?.artists || 0,
          });
          if (userList.length > 0) toast.success(`✅ Loaded ${userList.length} users`);
        } else {
          setError(data.message || "Failed to load system users");
        }
      } catch (err) {
        setError("Connection to Arena failed");
        toast.error("⚠️ Connection Error");
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.token) fetchAdmins();
  }, [currentUser?.token]);

  // --- Update admin ---
  const updateAdmin = async (id, updateData) => {
    try {
      const res = await fetch(`/api/admin/update/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`,
        },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("User updated");
        setAdmins((prev) => prev.map((a) => (a._id === id ? { ...a, ...updateData } : a)));
        setEditingAdmin(null);
      }
    } catch {
      toast.error("Update failed");
    }
  };

  // --- Delete admin ---
  const deleteAdmin = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/admin/delete/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${currentUser.token}` },
      });
      const data = await res.json();
      if (data.success) {
        toast.dark("User removed");
        setAdmins((prev) => prev.filter((a) => a._id !== id));
      }
    } catch {
      toast.error("Deletion failed");
    }
  };

  const filteredAdmins = admins.filter(
    (admin) =>
      admin.username?.toLowerCase().includes(search.toLowerCase()) ||
      admin.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto bg-white min-h-screen rounded-3xl shadow-sm mt-10">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900">System Users</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Identity Management</p>
        </div>
        <Link
          to="/admin-signup"
          className="bg-black text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          + Create User
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-10 text-slate-900">
        <StatItem color="bg-blue-600" label="Admins" value={counts.admins} />
        <StatItem color="bg-yellow-500" label="Super" value={counts.superadmins} />
        <StatItem color="bg-green-600" label="Artists" value={counts.artists} />
      </div>

      <div className="relative mb-8">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-4 pl-6 bg-slate-50 border-none rounded-2xl font-bold text-sm text-slate-900 focus:ring-2 ring-black transition-all"
        />
      </div>

      {loading ? (
        <div className="py-20 text-center animate-pulse font-black uppercase tracking-widest text-slate-300">Synchronizing...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredAdmins.map((admin) => (
            <div key={admin._id} className="bg-slate-50 p-6 rounded-[2rem] flex justify-between items-center border border-transparent hover:border-slate-200 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-200 rounded-full overflow-hidden">
                    <img src={admin.avatar || `https://ui-avatars.com/api/?name=${admin.username}`} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-black uppercase italic text-slate-800">{admin.username}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{admin.email}</p>
                  <span className={`inline-block mt-2 text-[8px] font-black uppercase px-2 py-1 rounded-md ${admin.role === 'superadmin' ? 'bg-yellow-100 text-yellow-600' : 'bg-blue-100 text-blue-600'}`}>
                    {admin.role}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditingAdmin(admin)} className="p-3 bg-white text-blue-600 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all"><EditIcon /></button>
                <button onClick={() => deleteAdmin(admin._id)} className="p-3 bg-white text-red-600 rounded-xl shadow-sm hover:bg-red-600 hover:text-white transition-all"><TrashIcon /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ FIXED EDIT MODAL WITH VISIBLE TEXT */}
      {editingAdmin && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[300] flex items-center justify-center p-6" onClick={() => setEditingAdmin(null)}>
              <div className="bg-white w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-black uppercase italic mb-6 text-slate-900">Modify User</h3>
                  <form onSubmit={(e) => {
                      e.preventDefault();
                      updateAdmin(editingAdmin._id, { username: e.target.username.value, email: e.target.email.value });
                  }} className="space-y-5">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Username</label>
                        <input 
                          name="username" 
                          defaultValue={editingAdmin.username} 
                          className="w-full p-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 ring-blue-500 transition-all outline-none" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Email Address</label>
                        <input 
                          name="email" 
                          defaultValue={editingAdmin.email} 
                          className="w-full p-4 bg-slate-100 border-none rounded-2xl font-bold text-slate-900 focus:ring-2 ring-blue-500 transition-all outline-none" 
                        />
                      </div>
                      <button type="submit" className="w-full bg-black text-white p-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg">
                        Update Identity
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditingAdmin(null)}
                        className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest text-center"
                      >
                        Cancel
                      </button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

const StatItem = ({ color, label, value }) => (
  <div className={`${color} p-4 rounded-2xl text-white flex flex-col items-center shadow-lg`}>
    <span className="text-2xl font-black">{value}</span>
    <span className="text-[8px] font-bold uppercase tracking-widest opacity-70">{label}</span>
  </div>
);

const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;

export default AdminList;