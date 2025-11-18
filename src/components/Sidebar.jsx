import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, PieChart, Clock, User, LogOut } from "lucide-react";

export default function Sidebar({ token, setToken }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    setToken("");
    navigate("/login");
  };

  const links = [
    { name: "Dashboard", path: "/", icon: <LayoutDashboard size={18} /> },
    { name: "Analytics", path: "/analytics", icon: <PieChart size={18} /> },
    { name: "History", path: "/history", icon: <Clock size={18} /> },
    { name: "Profile", path: "/profile", icon: <User size={18} /> },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-72 bg-gradient-to-b from-[#0b0f16] to-[#0a0c11] border-r border-[#0f1014] p-6 flex flex-col">
      <div className="mb-8">
        <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
          MoneyFlow
        </div>
        <div className="text-sm text-gray-400 mt-1">Personal Finance</div>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((l) => (
          <NavLink
            key={l.name}
            to={l.path}
            end
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-4 py-3 rounded-xl transition 
               ${isActive ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg" : "text-gray-300 hover:bg-white/2 hover:text-purple-200"}`
            }
          >
            <div className="w-6 h-6 flex items-center justify-center">{l.icon}</div>
            <span className="font-medium">{l.name}</span>
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-1 rounded-r" style={{ background: "linear-gradient(180deg,#8b5cf6,#ec4899)" }} />
          </NavLink>
        ))}
      </nav>

      <div>
        <button onClick={logout} className="mt-6 w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white transition">
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  );
}
