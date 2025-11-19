import { useState } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";

export default function Profile() {
  const { token } = useOutletContext();
  const API_URL = import.meta.env.VITE_API_URL;

  // Initialize from localStorage (no need for useEffect)
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const [user, setUser] = useState({
    email: storedUser.email || "",
    username: storedUser.username || "",
    base_currency: storedUser.base_currency || "INR",
  });

  const [newUsername, setNewUsername] = useState(user.username);
  const [newCurrency, setNewCurrency] = useState(user.base_currency);

  const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

  const onSave = async (e) => {
    e.preventDefault();
    if (!token) return alert("Not authenticated");

    try {
      // update backend
      const res = await axios.post(
        `${API_URL}/api/set-username`,
        {
          username: newUsername,
          base_currency: newCurrency, // stored frontend only (backend has no field)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedUser = res.data.user;

      // save locally
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // notify app to refresh navbar/sidebar
      window.dispatchEvent(
        new CustomEvent("auth:token-changed", { detail: token })
      );

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update profile");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* USER CARD */}
      <div className="bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold">
            {user.username ? user.username[0].toUpperCase() : "U"}
          </div>

          <div>
            <h2 className="text-2xl font-semibold">{user.username}</h2>
            <p className="text-sm text-gray-300">{user.email}</p>
            <p className="mt-2 text-sm text-gray-400">
              Base currency: <strong>{user.base_currency}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* EDIT FORM */}
      <div className="bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
        <h3 className="text-lg font-semibold text-purple-300 mb-4">
          Edit Profile
        </h3>

        <form onSubmit={onSave} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">Username</label>
            <input
              className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734] text-white"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Email</label>
            <input
              className="w-full p-3 rounded-xl bg-[#0f1419] border border-[#232734] text-gray-400"
              value={user.email}
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Base Currency
            </label>
            <select
              className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734] text-white"
              value={newCurrency}
              onChange={(e) => setNewCurrency(e.target.value)}
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <button
            className="py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold"
            type="submit"
          >
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}
