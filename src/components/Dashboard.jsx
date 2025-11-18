import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { format, startOfDay, endOfDay } from "date-fns";
import { useSearch } from "../context/SearchContext";

export default function Dashboard({ token }) {
  const [expenses, setExpenses] = useState([]);
  const [rates, setRates] = useState({});
  const [newExpense, setNewExpense] = useState({ amount: "", category: "Food", note: "", currency: "INR" });
  const [loading, setLoading] = useState(true);
  const { term } = useSearch();

  const baseCurrency = useMemo(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return user.base_currency || "INR";
  }, []);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const [expRes, rateRes] = await Promise.all([
          axios.get("http://localhost:5000/api/expenses", { headers: { Authorization: `Bearer ${token}` } }),
          axios.get("http://localhost:5000/api/currency"),
        ]);
        if (mounted) {
          setExpenses(expRes.data || []);
          setRates(rateRes.data.rates || {});
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => (mounted = false);
  }, [token]);

  const convert = useCallback((amount, from) => {
    if (from === baseCurrency) return Number(amount);
    if (!rates[from] || !rates[baseCurrency]) return Number(amount);
    return (Number(amount) / rates[from]) * rates[baseCurrency];
  }, [rates, baseCurrency]);

  const todayExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const d = new Date(e.date);
      return d >= startOfDay(new Date()) && d <= endOfDay(new Date());
    });
  }, [expenses]);

  // filter by search term (case-insensitive)
  const filteredToday = useMemo(() => {
    if (!term || term.trim() === "") return todayExpenses;
    const t = term.toLowerCase();
    return todayExpenses.filter((e) => {
      const cat = (e.category || "").toLowerCase();
      const note = (e.note || "").toLowerCase();
      const amt = String(e.amount || "");
      const dt = format(new Date(e.date), "dd MMM yyyy hh:mm a").toLowerCase();
      return cat.includes(t) || note.includes(t) || amt.includes(t) || dt.includes(t);
    });
  }, [todayExpenses, term]);

  const totalToday = filteredToday.reduce((sum, e) => sum + convert(e.amount, e.currency), 0);

  const addExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/expenses", newExpense, { headers: { Authorization: `Bearer ${token}` } });
      setNewExpense({ amount: "", category: "Food", note: "", currency: "INR" });
      const res = await axios.get("http://localhost:5000/api/expenses", { headers: { Authorization: `Bearer ${token}` } });
      setExpenses(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Add failed");
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/expenses/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setExpenses(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      console.error("Delete failed:", err.response?.data || err.message || err);
      alert("Delete failed. See console.");
    }
  };

  if (loading) return <div className="text-xl">Loading...</div>;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
            Today's Overview
          </h1>
          <p className="text-gray-400 mt-1">
            Total Spent Today:{" "}
            <span className="text-xl font-bold text-green-400">₹{totalToday.toFixed(2)}</span>
          </p>
        </div>
      </div>

      {/* Grid: left = add card, right = list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Expense */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-b from-[#0f1419]/60 to-[#0b0f13]/40 border border-[#1a1b22] rounded-2xl p-6 shadow-xl">
            <h3 className="text-2xl font-semibold text-purple-300 mb-3">Add Expense</h3>
            <form onSubmit={addExpense} className="space-y-4">
              <input type="number" placeholder="Amount" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734] placeholder-gray-400 outline-none" required />
              <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734] text-gray-200">
                <option>Food</option><option>Transport</option><option>Shopping</option><option>Bills</option><option>Entertainment</option><option>Health</option><option>Other</option>
              </select>
              <input type="text" placeholder="Note (optional)" value={newExpense.note} onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })} className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734]" />
              <select value={newExpense.currency} onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })} className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734] text-gray-200">
                <option>INR</option><option>USD</option><option>EUR</option><option>GBP</option>
              </select>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold">Add Expense</button>
            </form>
          </div>
        </div>

        {/* Today's Expenses */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {filteredToday.length === 0 ? (
              <div className="text-gray-400">No expenses today</div>
            ) : (
              <div className="space-y-4">
                {filteredToday.map((e) => (
                  <div key={e._id} className="bg-[#0f1419] border border-[#1a1b22] rounded-xl p-4 flex items-center justify-between shadow-md">
                    <div>
                      <p className="font-semibold text-lg">{e.category}</p>
                      <p className="text-sm text-gray-400">{format(new Date(e.date), "dd MMM yyyy, hh:mm a")}</p>
                      {e.note && <p className="text-sm text-gray-300 mt-2">{e.note}</p>}
                    </div>

                    <div className="text-right">
                      <p className="text-xl font-bold text-green-400">₹{convert(e.amount, e.currency).toFixed(2)}</p>
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => deleteExpense(e._id)} className="text-sm text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
