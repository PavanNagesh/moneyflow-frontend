// moneyflow-frontend/src/components/SetupUsername.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function SetupUsername({ setToken }) {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  // If user already has username → skip page
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    if (u?.username) navigate("/");
  }, [navigate]);

  const submit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Session expired. Please login again.");
      return navigate("/login");
    }

    try {
      const res = await axios.post(
        `${API_URL}/api/set-username`,
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Save updated user data
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Notify App.jsx + Navbar + Sidebar
      if (setToken) setToken(token);
      window.dispatchEvent(
        new CustomEvent("auth:token-changed", { detail: token })
      );

      navigate("/");
    } catch (err) {
      console.error("Failed to set username:", err?.response?.data || err);
      alert("Failed to set username");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="bg-gray-900 p-10 rounded-xl shadow-2xl w-96">
        <h1 className="text-3xl font-bold mb-6 text-center">Set Your Username</h1>

        <form onSubmit={submit} className="space-y-6">
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full p-3 rounded bg-gray-800 text-white"
            required
          />

          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded text-lg font-bold"
          >
            Save Username
          </button>
        </form>
      </div>
    </div>
  );
}
