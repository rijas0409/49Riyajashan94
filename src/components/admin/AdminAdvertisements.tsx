import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, Trash2, Pause, Play, IndianRupee, MousePointerClick, BarChart3, Filter } from "lucide-react";

interface UserAd {
  id: string;
  user_id: string;
  user_role: string;
  ad_type: string;
  title: string;
  description: string | null;
  target_entity_type: string | null;
  target_route: string | null;
  image_url: string | null;
  start_date: string;
  end_date: string | null;
  daily_cost: number;
  total_cost: number;
  status: string;
  impressions: number;
  clicks: number;
  placement: string | null;
  created_at: string;
  user_name?: string;
  user_email?: string;
}

const adTypeLabels: Record<string, string> = {
  sponsored_listing: "Sponsored Listing",
  banner_ad: "Banner Ad",
  priority_boost: "Priority Boost",
  featured_pet: "Featured Pet of Day",
  urgent_badge: "Urgent Selling Badge",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  paused: "bg-amber-100 text-amber-700",
  expired: "bg-gray-100 text-gray-500",
  cancelled: "bg-red-100 text-red-600",
};

const roleLabels: Record<string, string> = {
  seller: "Pet Breeder",
  product_seller: "Product Seller",
  vet: "Vet",
  buyer: "Buyer",
};

const roleBadgeColors: Record<string, string> = {
  seller: "bg-blue-100 text-blue-700",
  product_seller: "bg-purple-100 text-purple-700",
  vet: "bg-teal-100 text-teal-700",
  buyer: "bg-gray-100 text-gray-600",
};

const AdminAdvertisements = () => {
  const { toast } = useToast();
  const [ads, setAds] = useState<UserAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");

  useEffect(() => { fetchAds(); }, []);

  const fetchAds = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("user_advertisements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching ads:", error);
      toast({ title: "Error loading advertisements", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch user profiles for names
    const userIds = [...new Set((data || []).map((a: any) => a.user_id))];
    let profileMap: Record<string, { name: string; email: string }> = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);
      (profiles || []).forEach((p: any) => {
        profileMap[p.id] = { name: p.name, email: p.email };
      });
    }

    const enriched = (data || []).map((ad: any) => ({
      ...ad,
      user_name: profileMap[ad.user_id]?.name || "Unknown",
      user_email: profileMap[ad.user_id]?.email || "",
    }));

    setAds(enriched);
    setLoading(false);
  };

  const toggleStatus = async (ad: UserAd) => {
    const newStatus = ad.status === "active" ? "paused" : "active";
    const { error } = await supabase
      .from("user_advertisements")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", ad.id);
    if (error) toast({ title: "Error", variant: "destructive" });
    else { toast({ title: `Ad ${newStatus === "active" ? "Activated" : "Paused"}` }); fetchAds(); }
  };

  const deleteAd = async (id: string) => {
    const { error } = await supabase.from("user_advertisements").delete().eq("id", id);
    if (error) toast({ title: "Error deleting", variant: "destructive" });
    else { toast({ title: "Advertisement Deleted" }); fetchAds(); }
  };

  const filtered = ads.filter((ad) => {
    const matchSearch = search === "" ||
      ad.title.toLowerCase().includes(search.toLowerCase()) ||
      ad.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      ad.user_email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || ad.user_role === filterRole;
    const matchStatus = filterStatus === "all" || ad.status === filterStatus;
    const matchType = filterType === "all" || ad.ad_type === filterType;
    return matchSearch && matchRole && matchStatus && matchType;
  });

  // Summary stats
  const totalRevenue = ads.reduce((sum, a) => sum + (a.total_cost || 0), 0);
  const activeCount = ads.filter((a) => a.status === "active").length;
  const totalImpressions = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(220,80%,50%)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[hsl(220,20%,15%)]">User Advertisements</h2>
        <p className="text-sm text-[hsl(220,15%,55%)] mt-1">All promotions & ads run by breeders, product sellers and vets across the platform</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-[hsl(220,20%,92%)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xs text-[hsl(220,15%,55%)] font-medium">Total Revenue</span>
          </div>
          <p className="text-xl font-bold text-[hsl(220,20%,15%)]">₹{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[hsl(220,20%,92%)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xs text-[hsl(220,15%,55%)] font-medium">Active Ads</span>
          </div>
          <p className="text-xl font-bold text-[hsl(220,20%,15%)]">{activeCount}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[hsl(220,20%,92%)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
              <Eye className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs text-[hsl(220,15%,55%)] font-medium">Impressions</span>
          </div>
          <p className="text-xl font-bold text-[hsl(220,20%,15%)]">{totalImpressions.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-[hsl(220,20%,92%)]">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <MousePointerClick className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-[hsl(220,15%,55%)] font-medium">Total Clicks</span>
          </div>
          <p className="text-xl font-bold text-[hsl(220,20%,15%)]">{totalClicks.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border border-[hsl(220,20%,92%)]">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-[hsl(220,15%,55%)]" />
          <span className="text-sm font-semibold text-[hsl(220,20%,15%)]">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,60%)]" />
            <Input
              placeholder="Search by name, email, title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-xl border-[hsl(220,20%,90%)]"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="rounded-xl border-[hsl(220,20%,90%)]">
              <SelectValue placeholder="Platform / Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="seller">Pet Breeder</SelectItem>
              <SelectItem value="product_seller">Product Seller</SelectItem>
              <SelectItem value="vet">Vet</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="rounded-xl border-[hsl(220,20%,90%)]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="rounded-xl border-[hsl(220,20%,90%)]">
              <SelectValue placeholder="Ad Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="sponsored_listing">Sponsored Listing</SelectItem>
              <SelectItem value="banner_ad">Banner Ad</SelectItem>
              <SelectItem value="priority_boost">Priority Boost</SelectItem>
              <SelectItem value="featured_pet">Featured Pet of Day</SelectItem>
              <SelectItem value="urgent_badge">Urgent Badge</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ads Table */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 border border-[hsl(220,20%,92%)] text-center">
          <BarChart3 className="w-12 h-12 text-[hsl(220,15%,75%)] mx-auto mb-3" />
          <p className="text-[hsl(220,15%,45%)] font-medium">No advertisements found</p>
          <p className="text-sm text-[hsl(220,15%,60%)] mt-1">
            {ads.length === 0
              ? "No users have run any advertisements yet"
              : "Try adjusting your filters"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[hsl(220,20%,92%)] bg-[hsl(220,20%,97%)]">
                  <th className="text-left px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">Role</th>
                  <th className="text-left px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">Ad Title</th>
                  <th className="text-left px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">Placement</th>
                  <th className="text-right px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">Cost</th>
                  <th className="text-center px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">Impressions</th>
                  <th className="text-center px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">Clicks</th>
                  <th className="text-center px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">Duration</th>
                  <th className="text-center px-4 py-3 font-semibold text-[hsl(220,15%,40%)]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ad) => (
                  <tr key={ad.id} className="border-b border-[hsl(220,20%,95%)] hover:bg-[hsl(220,20%,98%)] transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[hsl(220,20%,15%)]">{ad.user_name}</p>
                        <p className="text-xs text-[hsl(220,15%,55%)]">{ad.user_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${roleBadgeColors[ad.user_role] || "bg-gray-100 text-gray-600"}`}>
                        {roleLabels[ad.user_role] || ad.user_role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-[hsl(220,20%,20%)] max-w-[180px] truncate">{ad.title || "Untitled"}</p>
                      {ad.target_route && (
                        <p className="text-xs text-[hsl(220,15%,60%)]">Route: {ad.target_route}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium text-[hsl(220,15%,40%)]">
                        {adTypeLabels[ad.ad_type] || ad.ad_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-[hsl(220,15%,50%)] capitalize">{ad.placement?.replace(/_/g, " ") || "-"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <p className="font-semibold text-[hsl(220,20%,15%)]">₹{ad.total_cost.toLocaleString()}</p>
                      <p className="text-xs text-[hsl(220,15%,55%)]">₹{ad.daily_cost}/day</p>
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-[hsl(220,20%,25%)]">
                      {ad.impressions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-[hsl(220,20%,25%)]">
                      {ad.clicks.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${statusColors[ad.status] || "bg-gray-100 text-gray-500"}`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-[hsl(220,15%,40%)]">
                        {new Date(ad.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        {ad.end_date ? ` – ${new Date(ad.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}` : " – Ongoing"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => toggleStatus(ad)}
                          title={ad.status === "active" ? "Pause" : "Activate"}
                        >
                          {ad.status === "active" ? <Pause className="w-4 h-4 text-amber-500" /> : <Play className="w-4 h-4 text-emerald-500" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => deleteAd(ad.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAdvertisements;
