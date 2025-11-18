import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { Outlet } from "react-router-dom";
import UsernamePrompt from "./UsernamePrompt";

export default function ProtectedLayout({ token, setToken }) {
  return (
    <div className="flex min-h-screen bg-[#070818] text-white">
      <Sidebar token={token} setToken={setToken} />
      <div className="flex-1 ml-72">
        <Navbar token={token} setToken={setToken} />
        <main className="pt-20 px-8 pb-12 max-w-7xl mx-auto">
          <UsernamePrompt token={token} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
