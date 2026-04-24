import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import AdminOverview from "@/components/admin/AdminOverview";
import AdminUserManagement from "@/components/admin/AdminUserManagement";
import AdminVets from "@/components/admin/AdminVets";
import AdminProducts from "@/components/admin/AdminProducts";
import AdminFinancials from "@/components/admin/AdminFinancials";
import AdminBanners from "@/components/admin/AdminBanners";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminListings from "@/components/admin/AdminListings";
import AdminTransport from "@/components/admin/AdminTransport";
import AdminProfileSettings from "@/components/admin/AdminProfileSettings";
import AdminAdvertisements from "@/components/admin/AdminAdvertisements";
import AdminWallets from "@/components/admin/AdminWallets";
import AdminBuyers from "@/components/admin/AdminBuyers";
import AdminNotifications from "@/components/admin/AdminNotifications";

export interface AdminData {
  pendingSellers: any[];
  pendingPets: any[];
  reVerificationPets: any[];
  allPets: any[];
  pendingProducts: any[];
  pendingVets: any[];
  requests: any[];
  partners: any[];
  allUsers: any[];
  allVets: any[];
  allProducts: any[];
  allOrders: any[];
  sellerEarnings: any[];
  vetEarnings: any[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("overview");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [data, setData] = useState<AdminData>({
    pendingSellers: [], pendingPets: [], reVerificationPets: [], allPets: [],
    pendingProducts: [], pendingVets: [], requests: [], partners: [],
    allUsers: [], allVets: [], allProducts: [], allOrders: [],
    sellerEarnings: [], vetEarnings: [],
  });

  useEffect(() => { checkUser(); }, []);
  useEffect(() => { if (user) { fetchData(); fetchProfilePhoto(); } }, [user]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate("/auth-admin"); return; }
    const { data: userRole } = await supabase.rpc('get_user_role', { _user_id: session.user.id });
    if (userRole !== 'admin') {
      toast({ title: "Access Denied", description: "Admin access required.", variant: "destructive" });
      navigate("/"); return;
    }
    setUser(session.user);
  };

  const fetchProfilePhoto = async () => {
    const { data } = await supabase.from("profiles").select("profile_photo").eq("id", user.id).maybeSingle();
    if (data?.profile_photo) setProfilePhoto(data.profile_photo);
  };

  const fetchData = async () => {
    setLoading(true);
    const [requestsRes, partnersRes, sellersRes, petsRes, allPetsRes, productsRes, allUsersRes, allVetsRes, allProductsRes, ordersRes, sellerEarnRes, vetEarnRes] = await Promise.all([
      supabase.from("transport_requests").select("*, pet:pets(name, breed, images), seller:profiles!transport_requests_seller_id_fkey(name, phone), buyer:profiles!transport_requests_buyer_id_fkey(name, phone), partner:profiles!transport_requests_assigned_partner_id_fkey(name, phone)").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, name, phone, email").eq("role", "delivery_partner"),
      supabase.from("profiles").select("*").in("role", ["seller", "product_seller"]).eq("is_onboarding_complete", true).eq("is_admin_approved", false).order("priority_fee_paid", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("pets").select("*, owner:profiles!pets_owner_id_fkey(name, phone)").eq("verification_status", "pending").order("priority_fee_paid", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("pets").select("*, owner:profiles!pets_owner_id_fkey(name, phone)").order("priority_fee_paid", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("shop_products").select("*, seller:profiles!shop_products_seller_id_fkey(name, phone)").eq("verification_status", "pending").order("priority_fee_paid", { ascending: false }).order("created_at", { ascending: false }),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("vet_profiles").select("*, profile:profiles!vet_profiles_user_id_fkey(name, email, phone, is_admin_approved, is_onboarding_complete, profile_photo)").order("created_at", { ascending: false }),
      supabase.from("shop_products").select("*, seller:profiles!shop_products_seller_id_fkey(name, phone)").order("created_at", { ascending: false }),
      supabase.from("orders").select("*, pet:pets(name), buyer:profiles!orders_buyer_id_fkey(name), seller:profiles!orders_seller_id_fkey(name)").order("created_at", { ascending: false }),
      supabase.from("seller_earnings").select("*").order("created_at", { ascending: false }),
      supabase.from("vet_earnings").select("*").order("created_at", { ascending: false }),
    ]);
    const pendingVetsData = (allVetsRes.data || []).filter((v: any) => v.verification_status === "pending" && v.profile?.is_onboarding_complete).sort((a: any, b: any) => {
      const aPriority = a.profile?.priority_fee_paid ? 1 : 0;
      const bPriority = b.profile?.priority_fee_paid ? 1 : 0;
      return bPriority - aPriority;
    });
    const pendingPets = petsRes.data || [];
    const newListings = pendingPets.filter((pet: any) => !pet.updated_at || pet.created_at === pet.updated_at);
    const reVerifications = pendingPets.filter((pet: any) => pet.updated_at && pet.created_at !== pet.updated_at);
    setData({
      requests: requestsRes.data || [], partners: partnersRes.data || [],
      pendingSellers: sellersRes.data || [], pendingPets: newListings,
      reVerificationPets: reVerifications, allPets: allPetsRes.data || [],
      pendingProducts: productsRes.data || [],
      pendingVets: pendingVetsData, allUsers: allUsersRes.data || [],
      allVets: allVetsRes.data || [], allProducts: allProductsRes.data || [],
      allOrders: ordersRes.data || [], sellerEarnings: sellerEarnRes.data || [],
      vetEarnings: vetEarnRes.data || [],
    });
    setLoading(false);
  };

  const approveSeller = async (id: string) => { const { error } = await supabase.from("profiles").update({ is_admin_approved: true }).eq("id", id); if (error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Approved" }); fetchData(); } };
  const rejectSeller = async (id: string) => { const { error } = await supabase.from("profiles").update({ is_onboarding_complete: false, is_admin_approved: false }).eq("id", id); if (error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Rejected" }); fetchData(); } };
  const verifyPet = async (id: string) => { const { error } = await supabase.from("pets").update({ verification_status: "verified" }).eq("id", id); if (error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Pet Verified" }); fetchData(); } };
  const rejectPet = async (id: string) => { const { error } = await supabase.from("pets").update({ verification_status: "failed" }).eq("id", id); if (error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Pet Rejected" }); fetchData(); } };
  const verifyProduct = async (id: string) => { const { error } = await supabase.from("shop_products").update({ verification_status: "verified" }).eq("id", id); if (error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Product Verified" }); fetchData(); } };
  const rejectProduct = async (id: string) => { const { error } = await supabase.from("shop_products").update({ verification_status: "failed" }).eq("id", id); if (error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Product Rejected" }); fetchData(); } };
  const approveVet = async (id: string) => { const [r1, r2] = await Promise.all([supabase.from("profiles").update({ is_admin_approved: true }).eq("id", id), supabase.from("vet_profiles").update({ verification_status: "verified" }).eq("user_id", id)]); if (r1.error || r2.error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Vet Approved" }); fetchData(); } };
  const rejectVet = async (id: string) => { const [r1, r2] = await Promise.all([supabase.from("profiles").update({ is_admin_approved: false, is_onboarding_complete: false }).eq("id", id), supabase.from("vet_profiles").update({ verification_status: "failed" }).eq("user_id", id)]); if (r1.error || r2.error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Vet Rejected" }); fetchData(); } };
  const assignPartner = async (requestId: string, partnerId: string) => { const { error } = await supabase.from("transport_requests").update({ assigned_partner_id: partnerId, status: "assigned", updated_at: new Date().toISOString() }).eq("id", requestId); if (error) toast({ title: "Error", variant: "destructive" }); else { toast({ title: "Partner Assigned" }); fetchData(); } };
  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth-admin"); };

  const actions = { approveSeller, rejectSeller, verifyPet, rejectPet, verifyProduct, rejectProduct, approveVet, rejectVet, assignPartner, handleLogout, fetchData };

  const handleSectionChange = (s: string) => {
    setActiveSection(s);
    setSidebarOpen(false);
  };

  const handleMenuToggle = () => {
    if (isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(220,20%,97%)] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[hsl(220,80%,50%)]"></div>
      </div>
    );
  }

  const renderSection = () => {
    switch (activeSection) {
      case "overview": return <AdminOverview data={data} actions={actions} setActiveSection={handleSectionChange} />;
      case "buyers": return <AdminBuyers />;
      case "users": return <AdminUserManagement data={data} actions={actions} />;
      case "vets": return <AdminVets data={data} actions={actions} />;
      case "products": return <AdminProducts data={data} actions={actions} />;
      case "financials": return <AdminFinancials data={data} />;
      case "banners": return <AdminBanners />;
      case "advertisements": return <AdminAdvertisements />;
      case "wallets": return <AdminWallets />;
      case "notifications": return <AdminNotifications />;
      case "settings": return <AdminSettings />;
      case "listings": return <AdminListings data={data} actions={actions} />;
      case "transport": return <AdminTransport data={data} actions={actions} />;
      case "profile": return <AdminProfileSettings user={user} onBack={() => setActiveSection("overview")} onProfileUpdate={(photo) => setProfilePhoto(photo)} />;
      default: return <AdminOverview data={data} actions={actions} setActiveSection={handleSectionChange} />;
    }
  };

  const sidebarWidth = sidebarCollapsed ? "72px" : "260px";

  return (
    <div className="min-h-screen bg-[hsl(220,20%,97%)] flex">
      {/* Desktop sidebar - always visible, toggles between full and collapsed */}
      {!isMobile && (
        <AdminSidebar
          activeSection={activeSection}
          setActiveSection={handleSectionChange}
          collapsed={sidebarCollapsed}
        />
      )}

      {/* Mobile sidebar - Sheet drawer */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="p-0 w-[260px]">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <AdminSidebar activeSection={activeSection} setActiveSection={handleSectionChange} isMobile />
          </SheetContent>
        </Sheet>
      )}

      <div
        className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out"
        style={!isMobile ? { marginLeft: sidebarWidth } : undefined}
      >
        <AdminTopBar user={user} profilePhoto={profilePhoto} onLogout={handleLogout} onMenuToggle={handleMenuToggle} onProfileSettings={() => handleSectionChange("profile")} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderSection()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
