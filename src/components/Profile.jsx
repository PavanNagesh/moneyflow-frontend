import { useEffect, useState } from "react";
import axios from "axios";

export default function Profile({ token }) {
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const [user, setUser] = useState(stored || {});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user.name || "",
    email: user.email || "",
    base_currency: user.base_currency || "INR",
  });
  const [saving, setSaving] = useState(false);
  const CURRENCIES = ["INR", "USD", "EUR", "GBP"];

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user") || "{}"));
  }, []);

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);

    // First try to persist server-side (if endpoint exists) — but fallback to localStorage
    try {
      if (token) {
        // If your backend exposes a user update endpoint, adjust URL/method accordingly.
        await axios.patch(
          "http://localhost:5000/api/user",
          { name: form.name, base_currency: form.base_currency },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (err) {
      // ignore server errors (we still persist locally)
      console.warn("Profile server update failed (ok if endpoint missing):", err?.message || err);
    }

    // persist locally
    const newUser = {
      ...user,
      name: form.name,
      base_currency: form.base_currency,
      email: form.email || user.email,
    };
    localStorage.setItem("user", JSON.stringify(newUser));
    setUser(newUser);
    setEditing(false);
    setSaving(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
        <div className="flex items-center gap-6">
          {user.picture ? (
            <img src={user.picture} alt="avatar" className="w-24 h-24 rounded-full border-2 border-purple-600 object-cover" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold">
              {user.name ? user.name[0].toUpperCase() : "U"}
            </div>
          )}

          <div>
            <h2 className="text-2xl font-semibold">{user.name || "Unnamed User"}</h2>
            <p className="text-sm text-gray-300">{user.email}</p>
            <p className="mt-2 text-sm text-gray-400">Base currency: <strong>{user.base_currency || "INR"}</strong></p>
          </div>
        </div>
      </div>

      <div className="bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-purple-300">Account Settings</h3>
          <button onClick={() => setEditing((s) => !s)} className="text-sm text-gray-300">
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {editing ? (
          <form onSubmit={onSave} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Name</label>
              <input className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734]" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Email (read-only)</label>
              <input className="w-full p-3 rounded-xl bg-[#0f1419] border border-[#232734]" value={form.email} readOnly />
            </div>

            <div>
              <label className="block text-sm text-gray-300 mb-1">Base Currency</label>
              <select className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734]" value={form.base_currency} onChange={(e) => setForm({ ...form, base_currency: e.target.value })}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-3">
              <button disabled={saving} className="py-2 px-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold">
                {saving ? "Saving..." : "Save changes"}
              </button>
              <button type="button" onClick={() => setEditing(false)} className="py-2 px-4 rounded-xl border border-[#232734] text-gray-300">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="text-sm text-gray-300">
            Use the edit button to change display name and preferred currency. Changes persist locally and will attempt to update the backend if an endpoint exists.
          </div>
        )}
      </div>
    </div>
  );
}
