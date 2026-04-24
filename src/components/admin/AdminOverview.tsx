import { AdminData } from "@/pages/AdminDashboard";
import { Users, Stethoscope, DollarSign, TrendingUp, TrendingDown, Download, Power } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useState, useMemo } from "react";

interface Props {
  data: AdminData;
  actions: any;
  setActiveSection: (s: string) => void;
}

function groupByDate(items: any[], dateField: string, days: number) {
  const now = new Date();
  const cutoff = new Date(now.getTime() - days * 86400000);
  const map: Record<string, number> = {};

  // Initialize all dates in range
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    map[key] = 0;
  }

  items.forEach((item) => {
    const d = new Date(item[dateField]);
    if (d >= cutoff) {
      const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (map[key] !== undefined) map[key]++;
    }
  });

  return Object.entries(map).map(([name, count]) => ({ name, count }));
}

function calcTrend(items: any[], dateField: string, days: number): { percent: string; up: boolean } {
  const now = Date.now();
  const currentStart = now - days * 86400000;
  const prevStart = currentStart - days * 86400000;

  const current = items.filter((i) => {
    const t = new Date(i[dateField]).getTime();
    return t >= currentStart && t <= now;
  }).length;

  const previous = items.filter((i) => {
    const t = new Date(i[dateField]).getTime();
    return t >= prevStart && t < currentStart;
  }).length;

  if (previous === 0 && current > 0) return { percent: "+100%", up: true };
  if (previous === 0) return { percent: "0%", up: true };
  const change = ((current - previous) / previous) * 100;
  return {
    percent: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    up: change >= 0,
  };
}

function calcRevenueTrend(sellerEarnings: any[], vetEarnings: any[], days: number) {
  const now = Date.now();
  const currentStart = now - days * 86400000;
  const prevStart = currentStart - days * 86400000;

  const sumInRange = (items: any[], start: number, end: number) =>
    items.filter((i) => {
      const t = new Date(i.created_at).getTime();
      return t >= start && t <= end;
    }).reduce((s, i) => s + (i.amount || 0), 0);

  const current = sumInRange(sellerEarnings, currentStart, now) + sumInRange(vetEarnings, currentStart, now);
  const previous = sumInRange(sellerEarnings, prevStart, currentStart) + sumInRange(vetEarnings, prevStart, currentStart);

  if (previous === 0 && current > 0) return { percent: "+100%", up: true };
  if (previous === 0) return { percent: "0%", up: true };
  const change = ((current - previous) / previous) * 100;
  return {
    percent: `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`,
    up: change >= 0,
  };
}

const AdminOverview = ({ data, actions, setActiveSection }: Props) => {
  const [chartRange, setChartRange] = useState("30");
  const days = parseInt(chartRange);

  const totalUsers = data.allUsers.length;
  const verifiedVets = data.allVets.filter((v: any) => v.verification_status === "verified").length;
  const totalRevenue = data.sellerEarnings.reduce((s: number, e: any) => s + (e.amount || 0), 0) + data.vetEarnings.reduce((s: number, e: any) => s + (e.amount || 0), 0);

  // Real trends
  const userTrend = useMemo(() => calcTrend(data.allUsers, "created_at", days), [data.allUsers, days]);
  const vetTrend = useMemo(() => calcTrend(data.allVets.filter((v: any) => v.verification_status === "verified"), "created_at", days), [data.allVets, days]);
  const revenueTrend = useMemo(() => calcRevenueTrend(data.sellerEarnings, data.vetEarnings, days), [data.sellerEarnings, data.vetEarnings, days]);

  // Real chart data - combine user signups, orders, and appointments per day
  const chartData = useMemo(() => {
    const usersByDate = groupByDate(data.allUsers, "created_at", days);
    const ordersByDate = groupByDate(data.allOrders, "created_at", days);

    return usersByDate.map((u, i) => ({
      name: u.name,
      signups: u.count,
      orders: ordersByDate[i]?.count || 0,
      total: u.count + (ordersByDate[i]?.count || 0),
    }));
  }, [data.allUsers, data.allOrders, days]);


  const pendingTasks = [
    ...data.pendingVets.map((v: any) => ({
      type: "vet" as const,
      title: "New Vet Verification",
      desc: `${v.profile?.name || "Doctor"} submitted credentials.`,
      time: getTimeAgo(v.created_at),
      color: "hsl(220,80%,50%)",
      id: v.user_id,
    })),
    ...data.pendingSellers.map((s: any) => ({
      type: "seller" as const,
      title: "Seller Verification",
      desc: `${s.full_name || s.name} awaiting approval.`,
      time: getTimeAgo(s.created_at),
      color: "hsl(35,90%,55%)",
      id: s.id,
    })),
    ...data.pendingPets.slice(0, 3).map((p: any) => ({
      type: "pet" as const,
      title: "Pet Listing Verification",
      desc: `${p.name} (${p.breed}) needs review.`,
      time: getTimeAgo(p.created_at),
      color: "hsl(145,60%,45%)",
      id: p.id,
    })),
    ...data.pendingProducts.slice(0, 3).map((p: any) => ({
      type: "product" as const,
      title: "Product Verification",
      desc: `${p.name} by ${p.seller?.name || "Unknown"}.`,
      time: getTimeAgo(p.created_at),
      color: "hsl(270,60%,55%)",
      id: p.id,
    })),
  ];

  const totalPending = pendingTasks.length;

  // Quick stats from real data
  const totalOrders = data.allOrders.length;
  const totalProducts = data.allProducts.filter((p: any) => p.verification_status === "verified").length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 md:mb-8 gap-3">
        <div>
          <h1 className="text-xl md:text-[28px] font-bold text-[hsl(220,20%,15%)]">Global Overview</h1>
          <p className="text-[hsl(220,15%,55%)] text-xs md:text-sm mt-1">Command center for PetLink platform operations.</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          <button className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 border border-[hsl(220,20%,88%)] rounded-xl text-xs md:text-sm font-medium text-[hsl(220,20%,20%)] bg-white hover:bg-[hsl(220,20%,97%)] transition-colors">
            <Download className="w-3.5 h-3.5 md:w-4 md:h-4" /> Export
          </button>
          <button onClick={() => actions.fetchData()} className="flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-medium text-white bg-[hsl(220,20%,15%)] hover:bg-[hsl(220,20%,25%)] transition-colors">
            <Power className="w-3.5 h-3.5 md:w-4 md:h-4" /> Refresh
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        <StatCard label="Total Users" value={totalUsers.toLocaleString()} trend={userTrend.percent} trendUp={userTrend.up} icon={<Users className="w-5 h-5 md:w-6 md:h-6 text-[hsl(220,80%,55%)]" />} barColor="hsl(220,80%,50%)" barPercent={Math.min(100, totalUsers * 2)} />
        <StatCard label="Verified Vets" value={verifiedVets.toLocaleString()} trend={vetTrend.percent} trendUp={vetTrend.up} icon={<Stethoscope className="w-5 h-5 md:w-6 md:h-6 text-[hsl(145,60%,45%)]" />} barColor="hsl(145,60%,50%)" barPercent={Math.min(100, verifiedVets * 10)} />
        <StatCard label="Total Orders" value={totalOrders.toLocaleString()} trend={calcTrend(data.allOrders, "created_at", days).percent} trendUp={calcTrend(data.allOrders, "created_at", days).up} icon={<DollarSign className="w-5 h-5 md:w-6 md:h-6 text-[hsl(35,80%,50%)]" />} barColor="hsl(35,80%,50%)" barPercent={Math.min(100, totalOrders * 5)} />
        <StatCard label="Gross Revenue" value={totalRevenue > 100000 ? `₹${(totalRevenue / 100000).toFixed(1)}L` : `₹${totalRevenue.toLocaleString("en-IN")}`} trend={revenueTrend.percent} trendUp={revenueTrend.up} icon={<DollarSign className="w-5 h-5 md:w-6 md:h-6 text-[hsl(270,60%,55%)]" />} barColor="hsl(270,60%,55%)" barPercent={65} />
      </div>

      {/* Chart + Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Platform Activity Chart - REAL DATA */}
        <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
            <div>
              <h2 className="text-base md:text-lg font-bold text-[hsl(220,20%,15%)]">Platform Activity</h2>
              <p className="text-xs md:text-sm text-[hsl(220,15%,55%)]">User signups & orders (last {days} days)</p>
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
          <div className="h-[220px] md:h-[320px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(220,80%,50%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(220,80%,50%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(145,60%,45%)" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="hsl(145,60%,45%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220,15%,60%)" }} interval={days > 30 ? 6 : days > 7 ? 2 : 0} />
                <YAxis hide />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid hsl(220,20%,92%)", fontSize: 13 }}
                  formatter={(value: number, name: string) => [value, name === "signups" ? "Signups" : "Orders"]}
                />
                <Area type="monotone" dataKey="signups" stroke="hsl(220,80%,50%)" strokeWidth={2} fillOpacity={1} fill="url(#colorSignups)" dot={days <= 14 ? { r: 3, fill: "hsl(220,80%,50%)", strokeWidth: 2, stroke: "white" } : false} />
                <Area type="monotone" dataKey="orders" stroke="hsl(145,60%,45%)" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" dot={days <= 14 ? { r: 3, fill: "hsl(145,60%,45%)", strokeWidth: 2, stroke: "white" } : false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(220,80%,50%)]" />
              <span className="text-[11px] text-[hsl(220,15%,55%)] font-medium">Signups</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[hsl(145,60%,45%)]" />
              <span className="text-[11px] text-[hsl(220,15%,55%)] font-medium">Orders</span>
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-4 md:p-5 flex flex-col max-h-[440px]">
          <div className="flex items-center gap-2 mb-4 md:mb-5">
            <h2 className="text-base md:text-lg font-bold text-[hsl(220,20%,15%)]">Pending Tasks</h2>
            <span className="px-2.5 py-0.5 bg-[hsl(0,75%,55%)] text-white text-[11px] font-bold rounded-full">{totalPending}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 md:space-y-4 pr-1">
            {pendingTasks.length === 0 ? (
              <p className="text-center text-[hsl(220,15%,60%)] py-8 text-sm">No pending tasks 🎉</p>
            ) : (
              pendingTasks.slice(0, 6).map((task, i) => (
                <div key={i} className="relative pl-3 md:pl-4 border-l-[3px] rounded-sm" style={{ borderColor: task.color }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-semibold text-[hsl(220,20%,15%)] truncate">{task.title}</p>
                      <p className="text-[11px] md:text-[13px] text-[hsl(220,15%,55%)] mt-0.5 truncate">{task.desc}</p>
                    </div>
                    <span className="text-[10px] md:text-[11px] text-[hsl(220,15%,60%)] whitespace-nowrap shrink-0">{task.time}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => {
                        if (task.type === "vet") actions.approveVet(task.id);
                        else if (task.type === "seller") actions.approveSeller(task.id);
                        else if (task.type === "pet") actions.verifyPet(task.id);
                        else actions.verifyProduct(task.id);
                      }}
                      className="px-2.5 md:px-3 py-1 md:py-1.5 bg-[hsl(220,80%,50%)] text-white text-[11px] md:text-[12px] font-medium rounded-lg hover:bg-[hsl(220,80%,45%)]"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        if (task.type === "vet") setActiveSection("vets");
                        else if (task.type === "seller") setActiveSection("users");
                        else if (task.type === "pet") setActiveSection("listings");
                        else setActiveSection("products");
                      }}
                      className="px-2.5 md:px-3 py-1 md:py-1.5 border border-[hsl(220,20%,88%)] text-[11px] md:text-[12px] font-medium rounded-lg text-[hsl(220,20%,30%)] hover:bg-[hsl(220,20%,96%)]"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          {pendingTasks.length > 6 && (
            <button className="mt-3 md:mt-4 text-xs md:text-sm font-medium text-[hsl(220,80%,50%)] hover:underline text-center">
              View All
            </button>
          )}
        </div>
      </div>


      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-5">
          <h2 className="text-base md:text-lg font-bold text-[hsl(220,20%,15%)]">Recent Transactions</h2>
          <button onClick={() => setActiveSection("financials")} className="text-xs md:text-sm font-medium text-[hsl(220,80%,50%)] hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full text-xs md:text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-[hsl(220,20%,92%)]">
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)] pl-4 md:pl-0">Order</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Buyer</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Seller</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Amount</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Status</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)] pr-4 md:pr-0">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.allOrders.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[hsl(220,15%,60%)]">No transactions yet</td></tr>
              ) : (
                data.allOrders.slice(0, 8).map((order: any) => (
                  <tr key={order.id} className="border-b border-[hsl(220,20%,95%)] hover:bg-[hsl(220,20%,98%)]">
                    <td className="py-3 font-medium text-[hsl(220,20%,20%)] pl-4 md:pl-0">#{order.id.slice(0, 8)}</td>
                    <td className="py-3 text-[hsl(220,15%,45%)]">{order.buyer?.name || "—"}</td>
                    <td className="py-3 text-[hsl(220,15%,45%)]">{order.seller?.name || "—"}</td>
                    <td className="py-3 font-semibold text-[hsl(220,20%,15%)]">₹{order.amount?.toLocaleString()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg text-[10px] md:text-[11px] font-semibold ${
                        order.status === "delivered" ? "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]" :
                        order.status === "cancelled" ? "bg-[hsl(0,50%,93%)] text-[hsl(0,65%,45%)]" :
                        order.status === "pending" ? "bg-[hsl(40,60%,92%)] text-[hsl(40,70%,35%)]" :
                        "bg-[hsl(220,40%,93%)] text-[hsl(220,60%,40%)]"
                      }`}>{order.status}</span>
                    </td>
                    <td className="py-3 text-[hsl(220,15%,60%)] pr-4 md:pr-0">{new Date(order.created_at).toLocaleDateString()}</td>
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

const StatCard = ({ label, value, trend, trendUp, icon, barColor, barPercent }: {
  label: string; value: string; trend: string; trendUp: boolean; icon: React.ReactNode; barColor: string; barPercent: number;
}) => (
  <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-4 md:p-5 relative overflow-hidden">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] md:text-[13px] text-[hsl(220,15%,55%)] font-medium">{label}</p>
        <div className="flex items-baseline gap-2 mt-1.5 md:mt-2">
          <p className="text-[22px] md:text-[30px] font-bold text-[hsl(220,20%,15%)] leading-none">{value}</p>
        </div>
        <span className={`text-[10px] md:text-[12px] font-semibold flex items-center gap-0.5 mt-1 ${trendUp ? "text-[hsl(145,60%,40%)]" : "text-[hsl(0,65%,50%)]"}`}>
          {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {trend} vs prev period
        </span>
      </div>
      <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-[hsl(220,20%,96%)] flex items-center justify-center">{icon}</div>
    </div>
    <div className="mt-3 md:mt-4 h-1 rounded-full bg-[hsl(220,20%,94%)]">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(barPercent, 100)}%`, backgroundColor: barColor }} />
    </div>
  </div>
);

function getTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}M AGO`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}H AGO`;
  const days = Math.floor(hours / 24);
  return `${days}D AGO`;
}

export default AdminOverview;
