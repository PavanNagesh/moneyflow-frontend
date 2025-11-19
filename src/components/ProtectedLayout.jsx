import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

/**
 * ProtectedLayout receives token + setToken from App.jsx.
 * It must NOT redirect to /login or /setup-username by itself.
 * Routing decisions are handled in App.jsx.
 *
 * Child components (Dashboard, Analytics, etc.)
 * will access token via Outlet context:
 * 
 *    const { token } = useOutletContext();
 */
export default function ProtectedLayout({ token, setToken }) {
  return (
    <div className="flex min-h-screen bg-gray-950 text-white">
      <Sidebar setToken={setToken} />

      <div className="flex-1 ml-64">
        <Navbar setToken={setToken} />

        <div className="pt-20 px-10 pb-10">
          {/* context gives token to Dashboard, History, etc */}
          <Outlet context={{ token, setToken }} />
        </div>
      </div>
    </div>
  );
}
