import { useEffect, useState } from "react";
import axios from "axios";

export default function UsernamePrompt({ token, onSaved }) {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.name || user.name.trim() === "") setVisible(true);
  }, []);

  const save = async () => {
    if (!name || name.trim() === "") return alert("Enter a name");
    try {
      if (token) {
        await axios.patch("http://localhost:5000/api/user", { name }, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (e) {
      console.warn("Server update failed:", e?.message || e);
    }
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    user.name = name;
    localStorage.setItem("user", JSON.stringify(user));
    setVisible(false);
    if (onSaved) onSaved(name);
  };

  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#071013] p-6 rounded-xl border border-[#11121a] w-full max-w-md">
        <h3 className="text-xl font-semibold mb-3">Choose a display name</h3>
        <p className="text-sm text-gray-400 mb-4">This will be shown in your profile and the navbar.</p>
        <input className="w-full p-3 rounded-lg bg-[#0f1419] border border-[#232734] mb-4" value={name} onChange={(e)=>setName(e.target.value)} placeholder="Your name" />
        <div className="flex justify-end gap-3">
          <button onClick={()=>setVisible(false)} className="py-2 px-4 rounded-xl border">Cancel</button>
          <button onClick={save} className="py-2 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500">Save</button>
        </div>
      </div>
    </div>
  );
}
