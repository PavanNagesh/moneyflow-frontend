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
import { format } from "date-fns";
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
        setRates(rateRes.data?.rates || {});
      } catch (err) {
        console.error("Analytics load error:", err);
      }
    };

    load();
    return () => (mounted = false);
  }, [token, API_URL]);

  // Convert backend timestamp → UTC date (no timezone shifts)
  const toUTC = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  };

  // Convert currency
  const convert = useCallback(
    (amount, from) => {
      if (!amount) return 0;
      if (from === baseCurrency) return Number(amount);
      if (!rates[from] || !rates[baseCurrency]) return Number(amount);
      return (Number(amount) / rates[from]) * rates[baseCurrency];
    },
    [rates]
  );

  // ✔ FIXED — Last 7 days
  const last7 = useMemo(() => {
    const now = new Date();
    const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    const result = [];

    for (let i = 6; i >= 0; i--) {
      const day = new Date(todayUTC);
      day.setUTCDate(day.getUTCDate() - i);

      const total = expenses
        .filter((e) => {
          const d = toUTC(e.date);
          return d.toISOString().slice(0, 10) === day.toISOString().slice(0, 10);
        })
        .reduce((sum, e) => sum + convert(e.amount, e.currency), 0);

      result.push({ day: format(day, "EEE"), total });
    }

    return result;
  }, [expenses, convert]);

  // Category Breakdown
  const categoryData = useMemo(() => {
    const map = new Map();
    expenses.forEach((e) => {
      const key = e.category || "Other";
      const amount = convert(e.amount, e.currency);
      map.set(key, (map.get(key) || 0) + amount);
    });
    return [...map].map(([name, value]) => ({ name, value }));
  }, [expenses, convert]);

  const topCategories = useMemo(() => {
    return [...categoryData].sort((a, b) => b.value - a.value).slice(0, 5);
  }, [categoryData]);

  // ✔ FIXED — Last 6 months
  const months = useMemo(() => {
    const now = new Date();
    const arr = [];

    for (let i = 5; i >= 0; i--) {
      const ref = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      const total = expenses
        .filter((e) => {
          const d = new Date(e.date);
          return d.getUTCFullYear() === ref.getUTCFullYear() && d.getUTCMonth() === ref.getUTCMonth();
        })
        .reduce((sum, e) => sum + convert(e.amount, e.currency), 0);

      arr.push({ month: format(ref, "MMM"), total });
    }

    return arr;
  }, [expenses, convert]);

  const grandTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + convert(e.amount, e.currency), 0),
    [expenses, convert]
  );

  return (
    <div className="space-y-8">
      {/* LAST 7 DAYS */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
          <h3 className="text-lg font-semibold text-purple-300 mb-2">Last 7 Days</h3>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={last7}>
                <XAxis dataKey="day" stroke="#7b8088" />
                <YAxis stroke="#7b8088" />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={3} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="w-96 bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
          <h3 className="text-lg font-semibold text-purple-300 mb-2">Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Total (all time)</span>
              <span className="font-semibold text-green-400">₹{grandTotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm text-gray-300">Tracked expenses</span>
              <span className="font-semibold text-gray-200">{expenses.length}</span>
            </div>

            <div>
              <p className="text-sm text-gray-300 mt-3">Top categories</p>
              <ul className="mt-2 space-y-2">
                {topCategories.map((c, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          background: COLORS[i % COLORS.length],
                          borderRadius: 3,
                          display: "inline-block",
                        }}
                      />
                      {c.name}
                    </div>
                    <span>₹{c.value.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CATEGORY + MONTHS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PIE */}
        <div className="bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
          <h3 className="text-lg font-semibold text-purple-300 mb-4">Category Breakdown</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `₹${v}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* BAR */}
        <div className="bg-[#0f1419] p-6 rounded-2xl border border-[#1a1b22]">
          <h3 className="text-lg font-semibold text-purple-300 mb-4">Last 6 Months</h3>
          <div style={{ width: "100%", height: 300 }}>
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
    </div>
  );
}
