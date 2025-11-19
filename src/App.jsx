import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";

import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";
import Profile from "./components/Profile";
import History from "./components/History";

import ProtectedLayout from "./components/ProtectedLayout";
import Login from "./components/Login";
import Register from "./components/Register";
import GoogleCallback from "./components/GoogleCallback";
import SetupUsername from "./components/SetupUsername";

export default function App() {
  // App-wide token state
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  // 1) Listen to localStorage changes (other tabs)
  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem("token") || "");
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 2) Listen to our custom same-tab event (GoogleCallback, SetupUsername, Profile)
  useEffect(() => {
    const onTokenChanged = (ev) => {
      const newToken = ev?.detail || localStorage.getItem("token") || "";
      setToken(newToken);
    };

    window.addEventListener("auth:token-changed", onTokenChanged);
    return () => window.removeEventListener("auth:token-changed", onTokenChanged);
  }, []);

  const isAuthenticated = !!token;

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register />} />

        {/* Google callback receives setToken to sync login */}
        <Route
          path="/google-callback"
          element={<GoogleCallback setToken={setToken} />}
        />

        {/* Username setup: must NOT be inside ProtectedLayout */}
        <Route
          path="/setup-username"
          element={<SetupUsername setToken={setToken} />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <ProtectedLayout token={token} setToken={setToken} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="profile" element={<Profile />} />
          <Route path="history" element={<History />} />
        </Route>

        {/* Fallback */}
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}
