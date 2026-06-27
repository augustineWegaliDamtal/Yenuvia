import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SystemLogs = () => {
  const { currentUser } = useSelector((state) => state.admin);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // --- Fetch logs ---
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/system-logs", {
          headers: { Authorization: `Bearer ${currentUser.token}` },
        });
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
          if (data.logs.length > 0) {
            toast.success(`✅ Loaded ${data.logs.length} logs successfully`);
          } else {
            toast.info("ℹ️ No logs found in the system");
          }
        } else {
          setError(data.message || "Failed to load logs");
          toast.error(data.message || "Failed to load logs");
        }
      } catch (err) {
        setError("Server error while fetching logs");
        toast.error("⚠️ Server error while fetching logs");
      } finally {
        setLoading(false);
      }
    };
    if (currentUser?.token) fetchLogs();
  }, [currentUser?.token]);

  // --- Filter logs ---
  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.user?.username || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">System Logs</h2>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by action or user"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full mb-4 p-2 border rounded"
      />

      {loading && <p>Loading logs...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && !error && filteredLogs.length === 0 && (
        <p>No logs found.</p>
      )}

      {!loading && !error && filteredLogs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300 rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Timestamp</th>
                <th className="px-4 py-2 border">User</th>
                <th className="px-4 py-2 border">Action</th>
                <th className="px-4 py-2 border">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-sm text-gray-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 border text-sm text-gray-800">
                    {log.user?.username || "System"}
                  </td>
                  <td className="px-4 py-2 border text-sm font-semibold">
                    {log.action}
                  </td>
                  <td className="px-4 py-2 border text-sm text-gray-600">
                    {log.details || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;
