import { Search, LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useSearch } from "../context/SearchContext";

export default function Navbar({ setToken }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const location = useLocation();
  const { term, setTerm } = useSearch();

  const titles = {
    "/": "Dashboard",
    "/analytics": "Analytics",
    "/profile": "Profile",
    "/history": "History",
  };

  const title = titles[location.pathname] || "";

  const logout = () => {
    localStorage.clear();
    setToken("");
    window.location.href = "/login";
  };

  return (
    <header className="fixed right-0 top-0 z-40 w-[calc(100%-18rem)] h-16 bg-gradient-to-b from-[#060612]/60 to-[#0b0d12]/50 backdrop-blur border-b border-[#11121a] flex items-center justify-between px-6">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-purple-300/95">{title}</h2>
      </div>

      <div className="flex items-center gap-5">
        {/* Search bar */}
        <div className="hidden md:flex items-center bg-[#0f1319] border border-[#1a1b22] rounded-lg px-3 py-2">
          <Search size={16} className="text-gray-400" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="ml-3 bg-transparent outline-none text-sm text-gray-300 placeholder-gray-500 w-56"
            placeholder="Search transactions, notes..."
          />
        </div>

        {/* USER + LOGOUT */}
        <div className="flex items-center gap-3 pl-3 border-l border-[#11121a]">
          {user.picture ? (
            <img
              src={user.picture}
              alt="avatar"
              className="w-9 h-9 rounded-full object-cover border-2 border-purple-600"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-700 flex items-center justify-center text-sm font-semibold">
              {user.username ? user.username[0].toUpperCase() : "U"}
            </div>
          )}

          <div className="hidden md:flex flex-col leading-tight">
            <span className="text-sm font-medium text-gray-200">{user.username || "User"}</span>
            <span className="text-xs text-gray-400">{user.email}</span>
          </div>

          <button
            onClick={logout}
            title="Logout"
            className="ml-4 p-2 rounded-md hover:bg-red-600/10 transition"
          >
            <LogOut size={18} className="text-red-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
