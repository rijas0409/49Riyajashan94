import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "@supabase/supabase-js";
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
import AdminVetAppointments from "@/components/admin/AdminVetAppointments";

export interface AdminData {
  pendingSellers: Record<string, any>[];
  pendingPets: Record<string, any>[];
  reVerificationPets: Record<string, any>[];
  allPets: Record<string, any>[];
  pendingProducts: Record<string, any>[];
  pendingVets: Record<string, any>[];
  requests: Record<string, any>[];
  partners: Record<string, any>[];
  allUsers: Record<string, any>[];
  allVets: Record<string, any>[];
  allProducts: Record<string, any>[];
  allOrders: Record<string, any>[];
  sellerEarnings: Record<string, any>[];
  vetEarnings: Record<string, any>[];
  vetAppointments: Record<string, any>[];
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [data, setData] = useState<AdminData>({
    pendingSellers: [], pendingPets: [], reVerificationPets: [], allPets: [],
    pendingProducts: [], pendingVets: [], requests: [], partners: [],
    allUsers: [], allVets: [], allProducts: [], allOrders: [],
    sellerEarnings: [], vetEarnings: [], vetAppointments: []
  });

  const checkUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth-admin"); return; }
      
      const { data: userRole } = await supabase.rpc('get_user_role', { _user_id: session.user.id });
      const metaRole = session.user.user_metadata?.role;

      if (userRole !== 'admin' && metaRole !== 'admin') {
        toast({ title: "Access Denied", description: "Admin access required.", variant: "destructive" });
        navigate("/"); return;
      }
      setUser(session.user);
    } catch (err: any) {
      console.error("checkUser error:", err);
      navigate("/auth-admin");
    }
  }, [navigate, toast]);

  const fetchProfilePhoto = useCallback(async () => {
    try {
      if (!user?.id) return;
      const { data } = await supabase.from("profiles").select("profile_photo").eq("id", user.id).maybeSingle();
      if (data?.profile_photo) {
        const url = data.profile_photo.startsWith("http") ? data.profile_photo : supabase.storage.from("vet-documents").getPublicUrl(data.profile_photo).data.publicUrl;
        setProfilePhoto(url);
      }
    } catch (err: any) {
      console.error("fetchProfilePhoto error:", err);
    }
  }, [user?.id]);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const [requestsRes, partnersRes, sellersRes, petsRes, allPetsRes, productsRes, allUsersRes, allVetsBaseRes, allProductsRes, ordersRes, sellerEarnRes, vetEarnRes, appointmentsRes] = await Promise.all([
        supabase.from("transport_requests").select("*, pet:pets(name, breed, images), seller:profiles!transport_requests_seller_id_fkey(name, phone), buyer:profiles!transport_requests_buyer_id_fkey(name, phone), partner:profiles!transport_requests_assigned_partner_id_fkey(name, phone)").order("created_at", { ascending: false }),
        supabase.from("profiles").select("id, name, phone, email").eq("role", "delivery_partner"),
        supabase.from("profiles").select("*").in("role", ["seller", "product_seller"]).eq("is_onboarding_complete", true).eq("is_admin_approved", false).order("priority_fee_paid", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("pets").select("*, owner:profiles!pets_owner_id_fkey(name, phone)").eq("verification_status", "pending").order("priority_fee_paid", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("pets").select("*, owner:profiles!pets_owner_id_fkey(name, phone)").order("priority_fee_paid", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("shop_products").select("*, seller:profiles!shop_products_seller_id_fkey(name, phone)").eq("verification_status", "pending").order("priority_fee_paid", { ascending: false }).order("created_at", { ascending: false }),
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("vet_profiles").select("*").order("created_at", { ascending: false }), // JS Join Step 1
        supabase.from("shop_products").select("*, seller:profiles!shop_products_seller_id_fkey(name, phone)").order("created_at", { ascending: false }),
        supabase.from("orders").select("*, pet:pets(name), buyer:profiles!orders_buyer_id_fkey(name), seller:profiles!orders_seller_id_fkey(name)").order("created_at", { ascending: false }),
        supabase.from("seller_earnings").select("*").order("created_at", { ascending: false }),
        supabase.from("vet_earnings").select("*").order("created_at", { ascending: false }),
        supabase.from("vet_appointments").select("*, vet:profiles!vet_appointments_vet_id_fkey(name, email, phone), user:profiles!vet_appointments_user_id_fkey(name, email, phone)").order("created_at", { ascending: false }),
      ]);
      const allUsersData = allUsersRes.data || [];
      
      // JS Join for Vets
      const vetBaseData = allVetsBaseRes.data || [];
      const userIdsLookup = vetBaseData.map((v) => v.user_id).filter(Boolean);
      let vetsProfilesData: any[] = [];
      if (userIdsLookup.length > 0) {
        const { data: vpData } = await supabase.from("profiles").select("*").in("id", userIdsLookup);
        vetsProfilesData = vpData || [];
      }
      
      const allVetsWithProfile = vetBaseData.map(v => {
        const p = vetsProfilesData.find(prof => prof.id === v.user_id);
        return {
          ...v,
          profile: p || null
        };
      });

      const pendingVetsData = allVetsWithProfile.filter((v) => {
        const isPending = v.verification_status === "pending";
        // Allow if onboarding is complete OR if we have valid profile link
        const isOnboarded = v.profile?.is_onboarding_complete || v.profile;
        return isPending && isOnboarded;
      }).sort((a, b) => {
        const aPriority = a.profile?.priority_fee_paid ? 1 : 0;
        const bPriority = b.profile?.priority_fee_paid ? 1 : 0;
        return bPriority - aPriority;
      });
      const pendingPets = petsRes.data || [];
      const newListings = pendingPets.filter((pet) => !pet.updated_at || pet.created_at === pet.updated_at);
      const reVerifications = pendingPets.filter((pet) => pet.updated_at && pet.created_at !== pet.updated_at);
      setData({
        requests: requestsRes.data || [], partners: partnersRes.data || [],
        pendingSellers: sellersRes.data || [], pendingPets: newListings,
        reVerificationPets: reVerifications, allPets: allPetsRes.data || [],
        pendingProducts: productsRes.data || [],
        pendingVets: pendingVetsData, allUsers: allUsersData,
        allVets: allVetsWithProfile, allProducts: allProductsRes.data || [],
        allOrders: ordersRes.data || [], sellerEarnings: sellerEarnRes.data || [],
        vetEarnings: vetEarnRes.data || [], vetAppointments: appointmentsRes.data || [],
      });
    } catch (err) {
      console.error("Fetch Data Error:", err);
      // If error is refresh token related, we might want to notify
      if (err instanceof Error && err.message.includes("Refresh Token")) {
        toast({ title: "Session Expired", description: "Please log in again.", variant: "destructive" });
      }
    } finally {
      if (!isSilent) setLoading(false);
      else setRefreshing(false);
    }
  }, [toast]);

  const approveSeller = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      pendingSellers: prev.pendingSellers.filter(s => s.id !== id),
      allUsers: prev.allUsers.map(u => u.id === id ? { ...u, is_admin_approved: true } : u)
    }));

    const { error } = await supabase.from("profiles").update({ is_admin_approved: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      await fetchData(true);
    } else {
      toast({ title: "Approved" });
      await fetchData(true);
    }
  }, [fetchData, toast]);

  const rejectSeller = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      pendingSellers: prev.pendingSellers.filter(s => s.id !== id),
      allUsers: prev.allUsers.map(u => u.id === id ? { ...u, is_admin_approved: false, is_onboarding_complete: false } : u)
    }));

    const { error } = await supabase.from("profiles").update({ is_onboarding_complete: false, is_admin_approved: false }).eq("id", id);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      await fetchData(true);
    } else {
      toast({ title: "Rejected" });
      await fetchData(true);
    }
  }, [fetchData, toast]);

  const verifyPet = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      pendingPets: prev.pendingPets.filter(p => p.id !== id),
      reVerificationPets: prev.reVerificationPets.filter(p => p.id !== id),
      allPets: prev.allPets.map(p => p.id === id ? { ...p, verification_status: 'verified' } : p)
    }));

    const { error } = await supabase.from("pets").update({ verification_status: "verified" }).eq("id", id);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      await fetchData(true);
    } else {
      toast({ title: "Pet Verified" });
      await fetchData(true);
    }
  }, [fetchData, toast]);

  const rejectPet = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      pendingPets: prev.pendingPets.filter(p => p.id !== id),
      reVerificationPets: prev.reVerificationPets.filter(p => p.id !== id),
      allPets: prev.allPets.map(p => p.id === id ? { ...p, verification_status: 'failed' } : p)
    }));

    const { error } = await supabase.from("pets").update({ verification_status: "failed" }).eq("id", id);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      await fetchData(true);
    } else {
      toast({ title: "Pet Rejected" });
      await fetchData(true);
    }
  }, [fetchData, toast]);

  const verifyProduct = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      pendingProducts: prev.pendingProducts.filter(p => p.id !== id),
      allProducts: prev.allProducts.map(p => p.id === id ? { ...p, verification_status: 'verified' } : p)
    }));

    const { error } = await supabase.from("shop_products").update({ verification_status: "verified" }).eq("id", id);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      await fetchData(true);
    } else {
      toast({ title: "Product Verified" });
      await fetchData(true);
    }
  }, [fetchData, toast]);

  const rejectProduct = useCallback(async (id: string) => {
    setData(prev => ({
      ...prev,
      pendingProducts: prev.pendingProducts.filter(p => p.id !== id),
      allProducts: prev.allProducts.map(p => p.id === id ? { ...p, verification_status: 'failed' } : p)
    }));

    const { error } = await supabase.from("shop_products").update({ verification_status: "failed" }).eq("id", id);
    if (error) {
      toast({ title: "Error", variant: "destructive" });
      await fetchData(true);
    } else {
      toast({ title: "Product Rejected" });
      await fetchData(true);
    }
  }, [fetchData, toast]);

  const approveVet = useCallback(async (id: string) => {
    console.log("Approving vet with ID:", id);
    // Removed optimistic update to prevent sync issues if DB fails.
    
    try {
      console.log("Starting approval for vet:", id);
      const { data: pUpdate, error: r1 } = await supabase
        .from("profiles")
        .update({ is_admin_approved: true, is_onboarding_complete: true })
        .eq("id", id)
        .select();
      
      if (r1) throw r1;
      
      if (!pUpdate || pUpdate.length === 0) {
        console.warn("Profiles update affected 0 rows for ID:", id);
        // Check if it's already approved (maybe someone else did it)
        const { data: checkData } = await supabase.from("profiles").select("is_admin_approved").eq("id", id).single();
        if (checkData?.is_admin_approved) {
          console.log("Profile was already approved, continuing with vet_profiles...");
        } else {
          throw new Error("Could not update user profile. This usually means your database permissions (RLS) aren't allowing this update or your user ID is not set as an 'admin' in the profiles table.");
        }
      }
      
      let payload: any = { 
        verification_status: "verified",
        rejection_reason: null,
        is_active: true,
        reviewed_by: user?.id
      };
      
      let { data: d2, error: r2 } = await supabase.from("vet_profiles").update(payload).eq("user_id", id).select("*");

      if (r2 && r2.message?.includes("Could not find the") || (r2 && r2.code === 'PGRST204')) {
        // Fallback for missing columns or schema issues
        payload = { verification_status: "verified", is_active: true };
        const fallbackRes = await supabase.from("vet_profiles").update(payload).eq("user_id", id).select("*");
        d2 = fallbackRes.data;
        r2 = fallbackRes.error;
      }

      if (r2) throw r2;
      
      // Audit Log
      await supabase.from("admin_vet_verification_logs").insert({
        vet_id: id,
        admin_id: user?.id,
        action: 'approve'
      });

      if (!d2 || d2.length === 0) {
        console.warn("Vet profiles update affected 0 rows for user_id:", id);
        throw new Error("Could not update vet database. The vet profile might not exist for this user.");
      }
      
      console.log("Approval successful for:", id);
      toast({ title: "Vet Approved Successfully" });
      
      // Automatically trigger bio generation on first approval
      const generateBio = async () => {
        try {
          // Fetch vet profile to get details for generation
          const { data: vp } = await supabase.from("vet_profiles").select("*").eq("user_id", id).single();
          const { data: prof } = await supabase.from("profiles").select("full_name, name").eq("id", id).single();
          
          if (vp) {
            console.log("Triggering auto bio generation for vet:", id);
            await fetch("/api/generate-vet-bio", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                vetId: vp.id,
                name: `Dr. ${prof?.full_name || prof?.name || "Doctor"}`,
                qualification: vp.qualification,
                yearsExp: vp.years_of_experience,
                specializations: vp.specializations,
                consultationType: vp.consultation_type,
                forceUpdate: true // Force generate fresh 
              })
            });
          }
        } catch (e) {
          console.warn("Auto bio generation failed during approval:", e);
        }
      };
      
      generateBio();
      
      // Force immediate refresh
      fetchData(true);
    } catch (err: any) {
      console.error("Approval error:", err);
      toast({ title: "Error Approving Vet", description: err.message, variant: "destructive" });
      await fetchData(true); // Revert on failure
    }
  }, [fetchData, toast, user?.id]);

  const rejectVet = useCallback(async (id: string, reason?: string) => {
    try {
      const { error: r1 } = await supabase.from("profiles").update({ is_admin_approved: false }).eq("id", id);
      
      let payload: any = { 
        verification_status: "failed",
        rejection_reason: reason || "Your application was not approved.",
        reviewed_by: user?.id
      };
      
      let { data: d2, error: r2 } = await supabase.from("vet_profiles").update(payload).eq("user_id", id).select("*");
      
      if (r2 && r2.message?.includes("Could not find the")) {
         payload = { verification_status: "failed" };
         const fallbackRes = await supabase.from("vet_profiles").update(payload).eq("user_id", id).select("*");
         d2 = fallbackRes.data;
         r2 = fallbackRes.error;
      }

      if (r1 || r2) throw r1 || r2;
      
      // Audit Log
      await supabase.from("admin_vet_verification_logs").insert({
        vet_id: id,
        admin_id: user?.id,
        action: 'reject',
        rejection_reason: reason || "Your application was not approved."
      });

      if (!d2 || d2.length === 0) throw new Error("Update failed: No rows updated. Possibly due to RLS.");
      
      toast({ title: "Vet Rejected" });
      setTimeout(() => fetchData(true), 500);
    } catch (err: any) {
      console.error("Rejection error:", err);
      toast({ title: "Error Rejecting Vet", description: err.message, variant: "destructive" });
      await fetchData(true); // Revert on failure
    }
  }, [fetchData, toast, user?.id]);

  const assignPartner = useCallback(async (requestId: string, partnerId: string) => {
    const { error } = await supabase.from("transport_requests").update({
      assigned_partner_id: partnerId,
      status: "assigned",
      updated_at: new Date().toISOString()
    }).eq("id", requestId);
    if (error) toast({ title: "Error", variant: "destructive" });
    else {
      toast({ title: "Partner Assigned" });
      await fetchData(true);
    }
  }, [fetchData, toast]);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    navigate("/auth-admin");
  }, [navigate]);

  const handleSectionChange = (s: string) => {
    setActiveSection(s);
    setSidebarOpen(false);
  };

  const actions = { 
    approveSeller, 
    rejectSeller, 
    verifyPet, 
    rejectPet, 
    verifyProduct, 
    rejectProduct, 
    approveVet, 
    rejectVet, 
    assignPartner, 
    handleLogout, 
    fetchData, 
    setActiveSection: handleSectionChange 
  };

  const handleMenuToggle = () => {
    if (isMobile) {
      setSidebarOpen(true);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  useEffect(() => { checkUser(); }, [checkUser]);
  useEffect(() => { 
    if (user) { 
      fetchData(); 
      fetchProfilePhoto(); 
      
      const channel = supabase.channel('admin_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'vet_profiles' }, (payload) => {
          console.log('Vet profile change detected:', payload);
          fetchData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, (payload) => {
          console.log('Profile change detected:', payload);
          fetchData(true);
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pets' }, () => fetchData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_products' }, () => fetchData(true))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transport_requests' }, () => fetchData(true))
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    } 
  }, [user, fetchData, fetchProfilePhoto]);

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
      case "vet_appointments": return <AdminVetAppointments data={data} actions={actions} />;
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
        <AdminTopBar 
          user={user} 
          profilePhoto={profilePhoto} 
          onLogout={handleLogout} 
          onMenuToggle={handleMenuToggle} 
          onProfileSettings={() => handleSectionChange("profile")} 
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {renderSection()}
        </main>
        <footer className="px-6 py-4 flex items-center justify-between border-t bg-white relative">
          {refreshing && (
             <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-100 overflow-hidden">
                <div className="h-full bg-blue-600 animate-loading-bar w-1/3"></div>
             </div>
          )}
          <p className="text-[12px] text-muted-foreground">© 2024 Sruvo Admin Intelligence System</p>
        </footer>
      </div>
    </div>
  );
};

export default AdminDashboard;
