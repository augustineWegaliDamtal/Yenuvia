import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import customFetch from "../utility/customFetch";

const AwardVerification = () => {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState("");


  // Fetch all artists for super admin view
  useEffect(() => {
  const fetchArtists = async () => {
    const res = await customFetch("/api/artists", {
      headers: {  Authorization: `Bearer ${currentUser.token}` },
    });
    const data = await res.json();
    if (data.success) setArtists(data.artists);
    setLoading(false);
  };
  fetchArtists();
}, []);


  // Award verification handler
  const handleVerify = async (id) => {
    try {
      const res = await customFetch(`/api/payments/verify/${id}`, {
        method: "PUT",
        headers: {  Authorization: `Bearer ${currentUser.token}`, },
      });
      const data = await res.json();
      if (data.success) {
        setArtists((prev) =>
          prev.map((a) => (a._id === id ? { ...a, ...data.data } : a))
        );
      } else {
        alert(data.message || "Failed to verify user");
      }
    } catch (err) {
      console.error("Verification error:", err);
    }
  };
  const handleUnverify = async (id) => {
  try {
    const res = await customFetch(`/api/payments/unverify/${id}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${currentUser.token}` },
    });
    const data = await res.json();
    if (data.success) {
      setArtists((prev) =>
        prev.map((a) => (a._id === id ? { ...a, ...data.data } : a))
      );
    } else {
      alert(data.message || "Failed to unverify user");
    }
  } catch (err) {
    console.error("Unverification error:", err);
  }
};
const filteredArtists = artists.filter(
  (artist) =>
    artist.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    artist.email.toLowerCase().includes(searchTerm.toLowerCase())
);



  if (loading) return <p>Loading artists...</p>;

  

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Award Verification</h2>
      {/* Search bar */}
  <input
    type="text"
    placeholder="Search artists..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full p-2 mb-4 border rounded"
    />
<ul className="space-y-4">
  {filteredArtists.map((artist) => (
    <li key={artist._id} className="flex items-center justify-between bg-white p-4 rounded shadow">
      <div className="flex items-center space-x-3">
        <img
          src={artist.avatar || "/default-avatar.png"}
          alt={artist.username}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div>
          <p className="font-medium">{artist.username}</p>
          <p className="text-sm text-gray-500">{artist.email}</p>
        </div>
      </div>
      <div>
        {artist.verified ? (
          <button
            onClick={() => handleUnverify(artist._id)}
            className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
          >
            Unverify
          </button>
        ) : (
          <button
            onClick={() => handleVerify(artist._id)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Verify
          </button>
        )}
      </div>
    </li>
  ))}
</ul>

    </div>
  );
};

export default AwardVerification;
