import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { format, startOfDay, subDays } from "date-fns";
import { useOutletContext } from "react-router-dom";

export default function History() {
  const { token } = useOutletContext();
  const [expenses, setExpenses] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    if (!token) return;
    let mounted = true;

    const load = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/expenses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (mounted) setExpenses(res.data || []);
      } catch (err) {
        console.error("History load error:", err);
      }
    };

    load();
    return () => (mounted = false);
  }, [token, API_URL]);

  const toLocal = (dateStr) => {
    const d = new Date(dateStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  };

  // LAST 7 DAYS
  const last7Group = useMemo(() => {
    const out = [];

    for (let i = 0; i < 7; i++) {
      const day = subDays(new Date(), i);
      const start = startOfDay(day).getTime();
      const end = start + 24 * 3600 * 1000 - 1;

      const items = expenses
        .filter((e) => {
          const local = toLocal(e.date).getTime();
          return local >= start && local <= end;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      out.push({ date: new Date(start), items });
    }

    return out;
  }, [expenses]);

  // MONTHLY SUMMARY
  const monthly = useMemo(() => {
    const map = new Map();

    expenses.forEach((e) => {
      const dt = toLocal(e.date);
      const key = `${dt.getFullYear()}-${dt.getMonth()}`;

      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    });

    return [...map.entries()]
      .map(([k, items]) => {
        const [year, month] = k.split("-");
        return { year: Number(year), month: Number(month), items };
      })
      .sort((a, b) => (b.year - a.year) || (b.month - a.month));
  }, [expenses]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">History</h1>

      <section>
        <h2 className="text-xl font-semibold mb-4">Last 7 days</h2>
        <div className="space-y-4">
          {last7Group.map((g) => (
            <div key={g.date.toISOString()} className="bg-[#0f1419] p-4 rounded-xl border border-[#1a1b22]">
              <h3 className="font-medium">{format(g.date, "dd MMM yyyy, EEE")}</h3>

              {g.items.length === 0 ? (
                <p className="text-gray-500 mt-2">No transactions</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {g.items.map((it) => (
                    <li key={it._id} className="flex justify-between">
                      <div>
                        <div className="font-semibold">{it.category}</div>
                        {it.note && <div className="text-sm text-gray-400">{it.note}</div>}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{it.amount}</div>
                        <div className="text-xs text-gray-500">
                          {format(toLocal(it.date), "hh:mm a")}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Monthly history</h2>
        <div className="space-y-4">
          {monthly.map((m) => (
            <div key={`${m.year}-${m.month}`} className="bg-[#0f1419] p-4 rounded-xl border border-[#1a1b22]">
              <h3 className="font-medium">
                {new Date(m.year, m.month).toLocaleString(undefined, {
                  month: "long",
                  year: "numeric",
                })}
              </h3>
              <div className="text-sm text-gray-300 mt-2">
                Total transactions: {m.items.length} — Total amount: ₹
                {m.items.reduce((s, x) => s + Number(x.amount || 0), 0)}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
