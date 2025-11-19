// moneyflow-frontend/src/components/GoogleCallback.jsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleCallback({ setToken }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");
    const backendName = params.get("name"); // backend sends Google display name
    const userId = params.get("userId");

    if (!token) {
      navigate("/login");
      return;
    }

    // Get any existing saved user (to preserve username)
    const existingUser = JSON.parse(localStorage.getItem("user") || "{}");

    // 1) Save token
    localStorage.setItem("token", token);

    // 2) Prepare user object
    const userObj = {
      id: userId || existingUser.id || "",
      email: email || existingUser.email || "",
      // if backend does NOT send username, keep the old one
      username: backendName?.trim() !== "" ? backendName : (existingUser.username || ""),
      base_currency: existingUser.base_currency || "INR",
    };

    // 3) Save user
    localStorage.setItem("user", JSON.stringify(userObj));

    // 4) Sync React state
    if (typeof setToken === "function") setToken(token);

    window.dispatchEvent(new CustomEvent("auth:token-changed", { detail: token }));

    // 5) Redirect
    setTimeout(() => {
      if (!userObj.username) {
        // First-time login (no username ever set)
        navigate("/setup-username");
      } else {
        // Username already set before → go home
        navigate("/");
      }
    }, 50);
  }, [setToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white">
      Processing login...
    </div>
  );
}
