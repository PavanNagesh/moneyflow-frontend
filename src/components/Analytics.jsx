import { useEffect, useState, useMemo, useCallback } from "react";
import axios from "axios";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { useOutletContext } from "react-router-dom";

const COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function Analytics() {
  const { token } = useOutletContext();
  const [expenses, setExpenses] = useState([]);
  const [rates, setRates] = useState({});
  const baseCurrency = "INR";
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!token) return;
    let mounted = true;

    const load = async () => {
      try {
        const [expRes, rateRes] = await Promise.all([
          axios.get(`${API_URL}/api/expenses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/currency`),
        ]);
        if (!mounted) return;
        setExpenses(expRes.data || []);
        setRates((rateRes && rateRes.data && rateRes.data.rates) || {});
      } catch (err) {
        console.error("Analytics load error:", err);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [token, API_URL]);

  const convert = useCallback(
    (amount, from) => {
      if (!amount) return 0;
      if (from === baseCurrency) return Number(amount);
      if (!rates[from] || !rates[baseCurrency]) return Number(amount);
      return (Number(amount) / rates[from]) * rates[baseCurrency];
    },
    [rates]
  );

  // helper: convert UTC date string to local Date object
  const toLocal = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  };

  // Last 7 days line data (oldest -> newest)
  const last7 = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(now, 6 - i); // oldest -> newest
      const dayStart = startOfDay(day).getTime();
      const dayEnd = endOfDay(day).getTime();

      const total = expenses
        .filter((e) => {
          const local = toLocal(e.date).getTime();
          return local >= dayStart && local <= dayEnd;
        })
        .reduce((s, ev) => s + convert(ev.amount, ev.currency), 0);

      return { day: format(day, "EEE"), total: Number(total.toFixed(2)) };
    });
  }, [expenses, convert]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const m = new Map();
    expenses.forEach((e) => {
      const key = e.category || "Other";
      const val = convert(e.amount, e.currency);
      m.set(key, (m.get(key) || 0) + val);
    });
    return Array.from(m, ([name, value]) => ({ name, value: Number(value.toFixed(2)) }));
  }, [expenses, convert]);

  // Top categories (for legend + small list)
  const topCategories = useMemo(() => {
    return [...categoryData].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [categoryData]);

  // Monthly totals (last 6 months)
  const months = useMemo(() => {
    const res = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() - 1;

      const total = expenses
        .filter((e) => {
          const local = toLocal(e.date).getTime();
          return local >= monthStart && local <= monthEnd;
        })
        .reduce((s, ev) => s + convert(ev.amount, ev.currency), 0);

      res.push({ month: format(d, "MMM"), total: Number(total.toFixed(2)) });
    }
    return res;
  }, [expenses, convert]);

  const grandTotal = useMemo(
    () => expenses.reduce((s, e) => s + convert(e.amount, e.currency), 0),
    [expenses, convert]
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
          <h3 className="text-lg font-semibold text-purple-300 mb-2">Last 7 Days</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={last7}>
                <XAxis dataKey="day" stroke="#7b8088" />
                <YAxis stroke="#7b8088" />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="w-96 bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
          <h3 className="text-lg font-semibold text-purple-300 mb-2">Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Total (all time)</span>
              <span className="font-semibold text-green-400">₹{Number(grandTotal.toFixed(2))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Tracked expenses</span>
              <span className="font-semibold text-gray-200">{expenses.length}</span>
            </div>
            <div>
              <p className="text-sm text-gray-300 mt-3">Top categories</p>
              <ul className="mt-2 space-y-2">
                {topCategories.length === 0 && <li className="text-gray-500">No data yet</li>}
                {topCategories.map((c, i) => (
                  <li key={c.name} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span style={{ width: 10, height: 10, background: COLORS[i % COLORS.length], display: "inline-block", borderRadius: 3 }} />
                      <span className="text-gray-200">{c.name}</span>
                    </div>
                    <span className="text-gray-300">₹{c.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Middle section: Pie + Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
          <h3 className="text-lg font-semibold text-purple-300 mb-4">Category Breakdown</h3>
          {categoryData.length === 0 ? (
            <div className="text-gray-500">No data to show</div>
          ) : (
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `₹${v}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
          <h3 className="text-lg font-semibold text-purple-300 mb-4">Last 6 Months</h3>
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <BarChart data={months}>
                <XAxis dataKey="month" stroke="#7b8088" />
                <YAxis stroke="#7b8088" />
                <Tooltip formatter={(v) => `₹${v}`} />
                <Bar dataKey="total" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Footer small note */}
      <div className="text-sm text-gray-500">
        Currency conversions use external API rates. Values are shown in <strong>INR</strong> (base).
      </div>
    </div>
  );
}
