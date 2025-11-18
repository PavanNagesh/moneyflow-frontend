import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import GoogleCallback from "./components/GoogleCallback";

import Dashboard from "./components/Dashboard";
import Analytics from "./components/Analytics";
import Profile from "./components/Profile";
import History from "./components/History";

import ProtectedLayout from "./components/ProtectedLayout";
import { useState } from "react";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const isLoggedIn = !!token;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isLoggedIn ? <Login setToken={setToken} /> : <Navigate to="/" />} />
        <Route path="/register" element={!isLoggedIn ? <Register setToken={setToken} /> : <Navigate to="/" />} />
        <Route path="/google-callback" element={<GoogleCallback setToken={setToken} />} />

        <Route path="/" element={isLoggedIn ? <ProtectedLayout token={token} setToken={setToken} /> : <Navigate to="/login" />}>
          <Route index element={<Dashboard token={token} />} />
          <Route path="analytics" element={<Analytics token={token} />} />
          <Route path="history" element={<History token={token} />} />
          <Route path="profile" element={<Profile token={token} />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
