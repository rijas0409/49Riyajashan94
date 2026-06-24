import { AdminData } from "@/pages/AdminDashboard";
import { useState, useMemo, useEffect } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Search, Calendar } from "lucide-react";

interface Props {
  data: AdminData;
}

const TABS = [
  "Performance & Analytics",
  "Core Services Revenue",
  "Ancillary & Growth Streams",
  "Ledger & Payout Operations"
];

const COLORS = ['#1a56db', '#10b981', '#f59e0b', '#8b5cf6'];

const AdminFinancials = ({ data }: Props) => {
  const [activeTab, setActiveTab] = useState(0);
  const [chartRange, setChartRange] = useState("30");
  const [searchTerm, setSearchTerm] = useState("");
  const days = parseInt(chartRange);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const tickInterval = useMemo(() => {
    if (days === 7) return 0;
    if (days === 30) return isMobile ? 6 : 2;
    return isMobile ? 18 : 6;
  }, [days, isMobile]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalSellerEarnings = data.sellerEarnings.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalVetEarnings = data.vetEarnings.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalCommission = data.sellerEarnings.reduce((s: number, e: any) => s + (e.commission || 0), 0) + data.vetEarnings.reduce((s: number, e: any) => s + (e.commission || 0), 0);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pendingTransactions = [...data.sellerEarnings, ...data.vetEarnings].filter((e: any) => e.payout_status === "pending");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalPending = pendingTransactions.reduce((s: number, e: any) => s + (e.net_amount || 0), 0);

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const allEarnings = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...data.sellerEarnings.map((e: any) => ({ ...e, source: "Seller" })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...data.vetEarnings.map((e: any) => ({ ...e, source: "Vet" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const clearedLogs = allEarnings.filter(e => e.payout_status === "paid" || e.payout_status === "completed").slice(0, 5);
  const pendingLogs = pendingTransactions.slice(0, 5);

  const filteredLedger = allEarnings.filter(e => 
    e.source.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (e.payout_status || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.sellerEarnings.forEach((e: any) => {
      const d = new Date(e.created_at);
      if (d >= cutoff) {
        const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        if (map[key]) map[key].seller += (e.amount || 0);
      }
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.vetEarnings.forEach((e: any) => {
      const d = new Date(e.created_at);
      if (d >= cutoff) {
        const key = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        if (map[key]) map[key].vet += (e.amount || 0);
      }
    });

    return Object.entries(map).map(([name, val]) => ({ name, seller: val.seller, vet: val.vet, total: val.seller + val.vet }));
  }, [data.sellerEarnings, data.vetEarnings, days]);

  const pieData = [
    { name: 'Veterinary Consultations', value: totalVetEarnings },
    { name: 'Pet Marketplace', value: totalSellerEarnings },
  ].filter(d => d.value > 0);
  if (pieData.length === 0) pieData.push({ name: 'No Data', value: 1 });

  return (
    <div className="bg-[#f8f9fa] -m-6 p-6 min-h-full font-sans">
      {/* Dashboard Header */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-[#111827]">Financials</h1>
        <p className="text-sm text-gray-500 mt-1">Revenue, commissions and payout overview</p>
      </div>

      {/* High-Level Summary (Always Visible) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        {[
          { label: "Total Revenue", value: fmt(totalSellerEarnings + totalVetEarnings), color: "hsl(220,80%,50%)" },
          { label: "Gross Transaction Value", value: fmt(totalSellerEarnings + totalVetEarnings), color: "hsl(145,60%,45%)" },
          { label: "Commissions Earned", value: fmt(totalCommission), color: "hsl(35,90%,50%)" },
          { label: "Pending Payouts", value: fmt(totalPending), color: "hsl(270,60%,55%)" },
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-row overflow-x-auto lg:flex-wrap gap-2 mb-6 border-b border-gray-200 pb-4 no-scrollbar scroll-smooth snap-x snap-mandatory">
        {TABS.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => setActiveTab(idx)}
            className={`px-4 py-2 rounded-full text-[13px] font-semibold transition-colors shrink-0 whitespace-nowrap snap-start ${
              activeTab === idx 
                ? "bg-[#111827] text-white" 
                : "bg-transparent text-gray-500 hover:bg-gray-100 hover:text-[#111827]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: Performance & Analytics */}
      {activeTab === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
            {/* Bar Chart */}
            <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col">
               <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                 <div>
                   <h2 className="text-base md:text-lg font-bold text-[#111827]">Revenue Trend</h2>
                   <p className="text-xs md:text-sm text-gray-500">Daily earnings breakdown (last {days} days)</p>
                 </div>
                 <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5">
                    <Calendar size={14} className="text-gray-500" />
                    <select
                      value={chartRange}
                      onChange={(e) => setChartRange(e.target.value)}
                      className="bg-transparent border-none text-[13px] font-medium text-[#111827] focus:outline-none"
                    >
                      <option value="7">7 Days</option>
                      <option value="30">30 Days</option>
                      <option value="90">90 Days</option>
                    </select>
                 </div>
               </div>
               <div className="flex-1 min-h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData}>
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(220,15%,60%)" }} interval={tickInterval} />
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
            
            {/* Doughnut Chart */}
            <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col">
               <h2 className="text-base md:text-lg font-bold text-[#111827] mb-1">Revenue Sources</h2>
               <p className="text-xs text-gray-500 mb-4">Breakdown by core services</p>
               <div className="flex-1 min-h-[200px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => fmt(value)} contentStyle={{ borderRadius: 8, fontSize: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                     <span className="text-[22px] font-bold text-[#111827]">{fmt(totalSellerEarnings + totalVetEarnings)}</span>
                     <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Total</span>
                  </div>
               </div>
               <div className="mt-4 space-y-3">
                  {pieData.map((entry, index) => (
                     <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                           <span className="text-[12px] font-medium text-[#111827]">{entry.name}</span>
                        </div>
                        <span className="text-[12px] font-bold text-[#111827]">{fmt(entry.value)}</span>
                     </div>
                  ))}
               </div>
            </div>
          </div>

          {/* Top Revenue Drivers */}
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-2 mt-4">Top Revenue Drivers</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[12px] text-gray-500 font-medium uppercase tracking-wide">Vets</p>
                <p className="text-[20px] font-bold text-[#111827] mt-1">{fmt(totalVetEarnings)}</p>
             </div>
             <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[12px] text-gray-500 font-medium uppercase tracking-wide">Products</p>
                <p className="text-[20px] font-bold text-[#111827] mt-1">{fmt(totalSellerEarnings * 0.7)}</p>
             </div>
             <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[12px] text-gray-500 font-medium uppercase tracking-wide">Breeders</p>
                <p className="text-[20px] font-bold text-[#111827] mt-1">{fmt(totalSellerEarnings * 0.3)}</p>
             </div>
             <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col justify-center">
                <p className="text-[12px] text-gray-500 font-medium uppercase tracking-wide">Services</p>
                <p className="text-[20px] font-bold text-[#111827] mt-1">{fmt(0)}</p>
             </div>
          </div>
        </div>
      )}

      {/* Tab 2: Core Services Revenue */}
      {activeTab === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#e0e7ff] flex items-center justify-center mb-4">
                 <span className="text-[#1a56db] font-bold text-lg">V</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#111827] mb-1">Veterinary Consultations</h3>
              <p className="text-[13px] text-gray-500 mb-4">Remote and in-clinic visits</p>
              <p className="text-[28px] font-bold text-[#111827] mb-2">{fmt(totalVetEarnings)}</p>
              <div className="flex items-center gap-2 text-[12px]">
                 <span className="text-[#10b981] font-medium bg-[#ecfdf5] px-2 py-0.5 rounded-md">+8.2%</span>
                 <span className="text-gray-500">vs last month</span>
              </div>
           </div>
           <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#dcfce7] flex items-center justify-center mb-4">
                 <span className="text-[#10b981] font-bold text-lg">M</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#111827] mb-1">Pet Marketplace</h3>
              <p className="text-[13px] text-gray-500 mb-4">Products, food & accessories</p>
              <p className="text-[28px] font-bold text-[#111827] mb-2">{fmt(totalSellerEarnings * 0.7)}</p>
              <div className="flex items-center gap-2 text-[12px]">
                 <span className="text-[#10b981] font-medium bg-[#ecfdf5] px-2 py-0.5 rounded-md">+15.4%</span>
                 <span className="text-gray-500">vs last month</span>
              </div>
           </div>
           <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#fef3c7] flex items-center justify-center mb-4">
                 <span className="text-[#f59e0b] font-bold text-lg">B</span>
              </div>
              <h3 className="text-[16px] font-bold text-[#111827] mb-1">Pet Sourcing & Breeding</h3>
              <p className="text-[13px] text-gray-500 mb-4">Verified breeders & adoption</p>
              <p className="text-[28px] font-bold text-[#111827] mb-2">{fmt(totalSellerEarnings * 0.3)}</p>
              <div className="flex items-center gap-2 text-[12px]">
                 <span className="text-[#f59e0b] font-medium bg-[#fffbeb] px-2 py-0.5 rounded-md">-2.1%</span>
                 <span className="text-gray-500">vs last month</span>
              </div>
           </div>
        </div>
      )}

      {/* Tab 3: Ancillary & Growth Streams */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-[15px] font-bold text-[#111827] mb-1">Advertising & Ads</h3>
              <p className="text-[13px] text-gray-500 mb-6">Promoted listings & banners</p>
              <p className="text-[24px] font-bold text-[#111827] mb-2">{fmt(0)}</p>
              <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                 <div className="h-full bg-[#8b5cf6] w-0"></div>
              </div>
           </div>
           <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-[15px] font-bold text-[#111827] mb-1">Platform Subscriptions</h3>
              <p className="text-[13px] text-gray-500 mb-6">Pro vet & seller plans</p>
              <p className="text-[24px] font-bold text-[#111827] mb-2">{fmt(0)}</p>
              <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                 <div className="h-full bg-[#ec4899] w-0"></div>
              </div>
           </div>
           <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="text-[15px] font-bold text-[#111827] mb-1">Insurance & Protection</h3>
              <p className="text-[13px] text-gray-500 mb-6">Pet health coverage</p>
              <p className="text-[24px] font-bold text-[#111827] mb-2">{fmt(0)}</p>
              <div className="w-full h-1.5 bg-[#f3f4f6] rounded-full overflow-hidden">
                 <div className="h-full bg-[#14b8a6] w-0"></div>
              </div>
           </div>
        </div>
      )}

      {/* Tab 4: Ledger & Payout Operations */}
      {activeTab === 3 && (
        <div className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pending Payables */}
              <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-5 shadow-sm">
                 <h3 className="text-[16px] font-bold text-[#111827] mb-4">Pending Payables</h3>
                 <div className="space-y-3">
                    {pendingLogs.length === 0 ? (
                      <p className="text-[13px] text-gray-500 py-4 text-center">No pending payouts</p>
                    ) : pendingLogs.map((log, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                         <div>
                            <p className="text-[13px] font-bold text-[#111827]">{log.source} Payout</p>
                            <p className="text-[11px] text-gray-500">{new Date(log.created_at).toLocaleDateString()}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[13px] font-bold text-[#111827]">{fmt(log.net_amount)}</p>
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#fffbeb] text-[#f59e0b] text-[10px] font-bold uppercase tracking-wider mt-1">Pending</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
              
              {/* Recent Cleared Logs */}
              <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-5 shadow-sm">
                 <h3 className="text-[16px] font-bold text-[#111827] mb-4">Recent Cleared Logs</h3>
                 <div className="space-y-3">
                    {clearedLogs.length === 0 ? (
                      <p className="text-[13px] text-gray-500 py-4 text-center">No cleared logs yet</p>
                    ) : clearedLogs.map((log, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                         <div>
                            <p className="text-[13px] font-bold text-[#111827]">{log.source} Payout</p>
                            <p className="text-[11px] text-gray-500">{new Date(log.created_at).toLocaleDateString()}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-[13px] font-bold text-[#111827]">{fmt(log.net_amount)}</p>
                            <span className="inline-block px-2 py-0.5 rounded-md bg-[#ecfdf5] text-[#10b981] text-[10px] font-bold uppercase tracking-wider mt-1">Cleared</span>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Audit Revenue Ledger */}
           <div className="bg-[#ffffff] rounded-2xl border border-gray-100 p-6 shadow-sm">
             <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
                <h2 className="text-lg font-bold text-[#111827]">Audit Revenue Ledger</h2>
                <div className="relative w-full sm:w-auto">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                   <input 
                     type="text" 
                     placeholder="Search ledger..." 
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                     className="w-full sm:w-[250px] pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-[13px] bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a56db]/20 transition-all"
                   />
                </div>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-sm min-w-[700px]">
                 <thead>
                   <tr className="border-b border-gray-100">
                     <th className="pb-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-[11px]">Source</th>
                     <th className="pb-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-[11px]">Gross Amount</th>
                     <th className="pb-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-[11px]">Commission</th>
                     <th className="pb-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-[11px]">Net Payable</th>
                     <th className="pb-3 text-left font-semibold text-gray-500 uppercase tracking-wider text-[11px]">Status</th>
                     <th className="pb-3 text-right font-semibold text-gray-500 uppercase tracking-wider text-[11px]">Date</th>
                   </tr>
                 </thead>
                 <tbody>
                   {filteredLedger.length === 0 ? (
                     <tr><td colSpan={6} className="py-8 text-center text-gray-500">No records found matching your search.</td></tr>
                   ) : (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
                     filteredLedger.slice(0, 50).map((e: any) => (
                       <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                         <td className="py-3">
                           <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${e.source === "Vet" ? "bg-[#e0e7ff] text-[#1a56db]" : "bg-gray-100 text-gray-600"}`}>{e.source}</span>
                         </td>
                         <td className="py-3 font-medium text-[#111827]">{fmt(e.amount)}</td>
                         <td className="py-3 text-gray-500">{fmt(e.commission)}</td>
                         <td className="py-3 font-bold text-[#10b981]">{fmt(e.net_amount)}</td>
                         <td className="py-3">
                           <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                             e.payout_status === "paid" || e.payout_status === "completed" ? "bg-[#ecfdf5] text-[#10b981]" :
                             "bg-[#fffbeb] text-[#f59e0b]"
                           }`}>{e.payout_status}</span>
                         </td>
                         <td className="py-3 text-right text-gray-500 text-[13px]">{new Date(e.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinancials;

