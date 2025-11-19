import { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useOutletContext } from "react-router-dom";
import { format, startOfDay, endOfDay } from "date-fns";
import { useSearch } from "../context/SearchContext";

export default function Dashboard() {
  const { token } = useOutletContext();
  const { term } = useSearch();

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const API_URL = import.meta.env.VITE_API_URL;

  const [expenses, setExpenses] = useState([]);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  const [newExpense, setNewExpense] = useState({
    amount: "",
    category: "Food",
    note: "",
    currency: "INR",
  });

  const baseCurrency = user.base_currency || "INR";

  // Load data
  useEffect(() => {
    if (!token) return;

    let mounted = true;

    const load = async () => {
      try {
        const [expRes, rateRes] = await Promise.all([
          axios.get(`${API_URL}/api/expenses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/currency`)
        ]);

        if (!mounted) return;

        setExpenses(expRes.data || []);
        setRates(rateRes.data?.rates || {});
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => (mounted = false);
  }, [token, API_URL]);

  // FIX: Correct timezone handling
  const toLocal = useCallback((dateStr) => new Date(dateStr), []);

  // FIX: Correct today's filter
  const todayExpenses = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    return expenses.filter((e) => {
      const d = toLocal(e.date);
      return d >= todayStart && d <= todayEnd;
    });
  }, [expenses, toLocal]);

  // Search filter
  const filteredToday = useMemo(() => {
    if (!term?.trim()) return todayExpenses;

    const t = term.toLowerCase();

    return todayExpenses.filter((e) => {
      const cat = e.category?.toLowerCase() || "";
      const note = e.note?.toLowerCase() || "";
      const amt = String(e.amount);
      const dateText = format(toLocal(e.date), "dd MMM yyyy hh:mm a").toLowerCase();

      return (
        cat.includes(t) ||
        note.includes(t) ||
        amt.includes(t) ||
        dateText.includes(t)
      );
    });
  }, [todayExpenses, term, toLocal]);

  // Currency conversion
  const convert = useCallback(
    (amount, from) => {
      const amt = Number(amount);
      if (!amt) return 0;

      if (from === baseCurrency) return amt;

      if (!rates[from] || !rates[baseCurrency]) return amt;

      return (amt / rates[from]) * rates[baseCurrency];
    },
    [rates, baseCurrency]
  );

  const totalToday = filteredToday.reduce(
    (sum, e) => sum + convert(e.amount, e.currency),
    0
  );

  // Add expense
  const addExpense = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        `${API_URL}/api/expenses`,
        newExpense,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewExpense({
        amount: "",
        category: "Food",
        note: "",
        currency: "INR",
      });

      const updated = await axios.get(`${API_URL}/api/expenses`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setExpenses(updated.data || []);
    } catch (err) {
      console.error("Add expense failed:", err);
      alert("Add failed");
    }
  };

  // Delete
  const deleteExpense = async (id) => {
    if (!window.confirm("Delete this expense?")) return;

    try {
      await axios.delete(`${API_URL}/api/expenses/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setExpenses((prev) => prev.filter((e) => e._id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Delete failed");
    }
  };

  if (loading) return <div className="text-xl">Loading...</div>;

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-500">
            Hi, {user.username}! 👋
          </h1>

          <p className="text-gray-400 mt-1">
            Total Spent Today:{" "}
            <span className="text-xl font-bold text-green-400">
              ₹{totalToday.toFixed(2)}
            </span>
          </p>
        </div>
      </div>

      {/* Add Expense + Today's list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD */}
        <div>
          <div className="bg-[#0f1419] p-6 rounded-xl border border-[#1a1b22] shadow-xl">
            <h3 className="text-xl font-semibold text-purple-300 mb-3">
              Add Expense
            </h3>

            <form onSubmit={addExpense} className="space-y-4">
              <input
                type="number"
                placeholder="Amount"
                required
                value={newExpense.amount}
                onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734]"
              />

              <select
                value={newExpense.category}
                onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734]"
              >
                <option>Food</option>
                <option>Transport</option>
                <option>Shopping</option>
                <option>Bills</option>
                <option>Entertainment</option>
                <option>Health</option>
                <option>Other</option>
              </select>

              <input
                type="text"
                placeholder="Note (optional)"
                value={newExpense.note}
                onChange={(e) => setNewExpense({ ...newExpense, note: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734]"
              />

              <select
                value={newExpense.currency}
                onChange={(e) => setNewExpense({ ...newExpense, currency: e.target.value })}
                className="w-full p-3 rounded-xl bg-[#1a2230] border border-[#232734]"
              >
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
              </select>

              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 font-semibold">
                Add Expense
              </button>
            </form>
          </div>
        </div>

        {/* TODAY LIST */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {filteredToday.length === 0 ? (
              <div className="text-gray-400">No expenses today</div>
            ) : (
              filteredToday.map((e) => (
                <div key={e._id} className="bg-[#0f1419] p-4 rounded-xl border border-[#1a1b22] flex justify-between">
                  <div>
                    <p className="text-lg font-semibold">{e.category}</p>
                    <p className="text-gray-400 text-sm">
                      {format(toLocal(e.date), "dd MMM yyyy, hh:mm a")}
                    </p>
                    {e.note && <p className="text-sm mt-1 text-gray-300">{e.note}</p>}
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-bold text-green-400">
                      ₹{convert(e.amount, e.currency).toFixed(2)}
                    </p>
                    <button
                      onClick={() => deleteExpense(e._id)}
                      className="text-sm text-red-400 mt-2"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
