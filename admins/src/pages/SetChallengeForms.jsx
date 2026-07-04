import React from 'react'
import { useState } from 'react';
import { useSelector } from 'react-redux';
import customFetch from '../utility/customFetch';

const SetChallengeForms = () => {
 const [topic, setTopic] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
const { currentUser } = useSelector((state) => state.admin);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await customFetch("/api/challenge/set-weekly", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ topic, description }),
      });

      const data = await res.json();
      if (data.success) {
        setMessage("✅ Challenge set successfully!");
        setTopic("");
        setDescription("");
      } else {
        setMessage(`❌ ${data.message || "Failed to set challenge"}`);
      }
    } catch (error) {
      console.error("Error setting challenge:", error);
      setMessage("❌ Server error. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded shadow-md mb-6">
      <h3 className="text-lg font-bold mb-4">Set Weekly Challenge</h3>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Challenge topic"
          className="border p-2 rounded"
          required
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Challenge description (optional)"
          className="border p-2 rounded"
          rows="3"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
          disabled={loading}
        >
          {loading ? "Setting..." : "Set Challenge"}
        </button>
      </form>
      {message && <p className="mt-3 text-sm">{message}</p>}
    </div>
  );
}

export default SetChallengeForms
