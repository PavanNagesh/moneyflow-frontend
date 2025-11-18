import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleCallback({ setToken }) {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const email = params.get("email");
    const name = params.get("name");
    const userId = params.get("userId");

    if (token) {
      localStorage.setItem("token", token);
      const user = { id: userId, email: email || "", name: name || "", base_currency: "INR" };
      localStorage.setItem("user", JSON.stringify(user));
      if (setToken) setToken(token);
      navigate("/");
    } else {
      navigate("/login");
    }
  }, []);

  return <div className="min-h-screen flex items-center justify-center">Processing login...</div>;
}
