import { AdminData } from "@/pages/AdminDashboard";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  data: AdminData;
}

const AdminFinancials = ({ data }: Props) => {
  const [chartRange, setChartRange] = useState("30");
  const days = parseInt(chartRange);

  const totalSellerEarnings = data.sellerEarnings.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const totalVetEarnings = data.vetEarnings.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const totalCommission = data.sellerEarnings.reduce((s: number, e: any) => s + (e.commission || 0), 0) + data.vetEarnings.reduce((s: number, e: any) => s + (e.commission || 0), 0);
  const totalPending = [...data.sellerEarnings, ...data.vetEarnings].filter((e: any) => e.payout_status === "pending").reduce((s: number, e: any) => s + (e.net_amount || 0), 0);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;

  const allEarnings = [
    ...data.sellerEarnings.map((e: any) => ({ ...e, source: "Seller" })),
    ...data.vetEarnings.map((e: any) => ({ ...e, source: "Vet" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // Revenue chart data
  const revenueChartData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - days * 86400000);
    const map: Record<string, { seller: number; vet: number }> = {};

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      map[key] = { seller: 0, vet: 0 };
    }

    data.sellerEarnings.forEach((e: any) => {
      const d = new Date(e.created_at);
      if (d >= cutoff) {
        const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        if (map[key]) map[key].seller += (e.amount || 0);
      }
    });

    data.vetEarnings.forEach((e: any) => {
      const d = new Date(e.created_at);
      if (d >= cutoff) {
        const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        if (map[key]) map[key].vet += (e.amount || 0);
      }
    });

    return Object.entries(map).map(([name, val]) => ({ name, seller: val.seller, vet: val.vet, total: val.seller + val.vet }));
  }, [data.sellerEarnings, data.vetEarnings, days]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[hsl(220,20%,15%)]">Financials</h1>
        <p className="text-sm text-[hsl(220,15%,55%)] mt-1">Revenue, commissions and payout overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[
          { label: "Total Revenue", value: fmt(totalSellerEarnings + totalVetEarnings), color: "hsl(220,80%,50%)" },
          { label: "Platform Commission", value: fmt(totalCommission), color: "hsl(145,60%,45%)" },
          { label: "Pending Payouts", value: fmt(totalPending), color: "hsl(35,90%,50%)" },
          { label: "Vet Earnings", value: fmt(totalVetEarnings), color: "hsl(270,60%,55%)" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-5">
            <p className="text-[13px] text-[hsl(220,15%,55%)] font-medium">{s.label}</p>
            <p className="text-[22px] md:text-[28px] font-bold text-[hsl(220,20%,15%)] mt-1">{s.value}</p>
            <div className="mt-3 h-1 rounded-full bg-[hsl(220,20%,94%)]">
              <div className="h-full rounded-full w-3/5" style={{ backgroundColor: s.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-4 md:p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
          <div>
            <h2 className="text-base md:text-lg font-bold text-[hsl(220,20%,15%)]">Revenue Trend</h2>
            <p className="text-xs md:text-sm text-[hsl(220,15%,55%)]">Daily earnings breakdown (last {days} days)</p>
          </div>
          <select
            value={chartRange}
            onChange={(e) => setChartRange(e.target.value)}
            className="px-3 md:px-4 py-2 border border-[hsl(220,20%,88%)] rounded-xl text-xs md:text-sm bg-white text-[hsl(220,20%,20%)] focus:outline-none"
          >
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
          </select>
        </div>
        <div className="h-[220px] md:h-[280px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueChartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220,15%,60%)" }} interval={days > 30 ? 6 : days > 7 ? 2 : 0} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid hsl(220,20%,92%)", fontSize: 13 }}
                formatter={(value: number, name: string) => [`₹${value.toLocaleString("en-IN")}`, name === "seller" ? "Seller Revenue" : "Vet Revenue"]}
              />
              <Bar dataKey="seller" stackId="a" fill="hsl(220,80%,50%)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="vet" stackId="a" fill="hsl(270,60%,55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-5 mt-3">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(220,80%,50%)]" />
            <span className="text-[11px] text-[hsl(220,15%,55%)] font-medium">Seller Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[hsl(270,60%,55%)]" />
            <span className="text-[11px] text-[hsl(220,15%,55%)] font-medium">Vet Revenue</span>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6">
        <h2 className="text-lg font-bold text-[hsl(220,20%,15%)] mb-5">Earnings & Payouts</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[hsl(220,20%,92%)]">
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Source</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Amount</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Commission</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Net</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Status</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Date</th>
              </tr>
            </thead>
            <tbody>
              {allEarnings.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[hsl(220,15%,60%)]">No earnings data yet</td></tr>
              ) : (
                allEarnings.slice(0, 30).map((e: any) => (
                  <tr key={e.id} className="border-b border-[hsl(220,20%,95%)] hover:bg-[hsl(220,20%,98%)]">
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${e.source === "Vet" ? "bg-[hsl(270,40%,93%)] text-[hsl(270,60%,45%)]" : "bg-[hsl(220,40%,93%)] text-[hsl(220,60%,40%)]"}`}>{e.source}</span>
                    </td>
                    <td className="py-3 font-medium text-[hsl(220,20%,15%)]">{fmt(e.amount)}</td>
                    <td className="py-3 text-[hsl(220,15%,45%)]">{fmt(e.commission)}</td>
                    <td className="py-3 font-semibold text-[hsl(145,60%,35%)]">{fmt(e.net_amount)}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        e.payout_status === "paid" ? "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]" :
                        "bg-[hsl(40,60%,92%)] text-[hsl(40,70%,35%)]"
                      }`}>{e.payout_status}</span>
                    </td>
                    <td className="py-3 text-[hsl(220,15%,60%)]">{new Date(e.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminFinancials;
