import { useEffect, useState } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import HeaderProfileDropdown from "@/components/HeaderProfileDropdown";
import {
  Heart, LogOut, Calendar, Video, MapPin, DollarSign, Star, Bell,
  CheckCircle, XCircle, Clock, Phone, Stethoscope, User, BarChart3,
  Wallet, MessageSquare, Edit, Eye, TrendingUp
} from "lucide-react";
import VetDashboardHome from "@/components/vet-dashboard/VetDashboardHome";
import VetVideoConsultations from "@/components/vet-dashboard/VetVideoConsultations";
import VetSchedule from "@/components/vet-dashboard/VetSchedule";
import VetEarnings from "@/components/vet-dashboard/VetEarnings";
import VetProfile from "@/components/vet-dashboard/VetProfile";

const VetDashboard = () => {
  const navigate = useNavigate();
  const { isLoading: guardLoading, user, profile, error: guardError } = useRoleGuard(["vet"], "/auth-vet");
  const [vetProfile, setVetProfile] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [notesDialog, setNotesDialog] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [consultationNotes, setConsultationNotes] = useState({ diagnosis: "", medicines: "", care_instructions: "" });
  const [editProfileDialog, setEditProfileDialog] = useState(false);
  const [editData, setEditData] = useState<any>({});

  useEffect(() => {
    if (!user || !profile) return;

    if (!profile.is_onboarding_complete) { navigate("/vet-onboarding"); return; }
    if (!profile.is_admin_approved) { navigate("/vet-pending-approval"); return; }

    fetchAll(false);

    const cleanup = setupRealtime();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [user, profile, navigate]);

  const fetchAll = async (silent: boolean) => {
    if (!silent) setIsLoading(true);

    const [vpRes, apRes, erRes, rvRes] = await Promise.all([
      supabase.from("vet_profiles").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("vet_appointments").select("*").eq("vet_id", user.id).order("appointment_date", { ascending: false }),
      supabase.from("vet_earnings").select("*").eq("vet_id", user.id).order("created_at", { ascending: false }),
      supabase.from("vet_reviews").select("*").eq("vet_id", user.id).order("created_at", { ascending: false }),
    ]);

    setVetProfile(vpRes.data);
    setAppointments(apRes.data || []);
    setEarnings(erRes.data || []);
    setReviews(rvRes.data || []);
    if (vpRes.data) setEditData(vpRes.data);

    if (!silent) setIsLoading(false);
  };

  const setupRealtime = () => {
    const channel = supabase
      .channel("vet-appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "vet_appointments", filter: `vet_id=eq.${user.id}` },
        () => fetchAll(true)
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  const updateAppointmentStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("vet_appointments").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update");
    else { toast.success(`Appointment ${status}`); fetchAll(true); }
  };

  const saveConsultationNotes = async () => {
    if (!selectedAppointment) return;
    const { error } = await supabase.from("vet_appointments").update({
      diagnosis: consultationNotes.diagnosis,
      medicines: consultationNotes.medicines,
      care_instructions: consultationNotes.care_instructions,
      status: "completed",
    }).eq("id", selectedAppointment.id);
    if (error) toast.error("Failed to save notes");
    else {
      // Create earnings entry
      const amount = selectedAppointment.amount || 0;
      const commission = amount * 0.15;
      await supabase.from("vet_earnings").insert({
        vet_id: user.id, appointment_id: selectedAppointment.id,
        amount, commission, net_amount: amount - commission,
      });
      toast.success("Consultation completed!");
      setNotesDialog(false);
      fetchAll(true);
    }
  };

  const updateVetProfile = async () => {
    const { error } = await supabase.from("vet_profiles").update({
      specializations: editData.specializations,
      online_fee: editData.online_fee,
      offline_fee: editData.offline_fee,
      clinic_address: editData.clinic_address,
      available_days: editData.available_days,
      morning_slots: editData.morning_slots,
      evening_slots: editData.evening_slots,
      consultation_type: editData.consultation_type,
    }).eq("user_id", user.id);
    if (error) toast.error("Failed to update profile");
    else { toast.success("Profile updated!"); setEditProfileDialog(false); fetchAll(true); }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth-vet"); };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.appointment_date === todayStr);
  const upcomingOnline = appointments.filter(a => a.appointment_type === "online" && ["pending", "confirmed"].includes(a.status));
  const upcomingOffline = appointments.filter(a => a.appointment_type === "offline" && ["pending", "confirmed"].includes(a.status));
  const thisMonthEarnings = earnings.filter(e => new Date(e.created_at).getMonth() === new Date().getMonth()).reduce((s, e) => s + Number(e.net_amount), 0);
  const avgRating = vetProfile?.average_rating || (reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "N/A");

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800", confirmed: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800", cancelled: "bg-red-100 text-red-800",
      rescheduled: "bg-purple-100 text-purple-800",
    };
    return <Badge className={`${map[status] || "bg-gray-100"} border-0`}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
  };

  if (guardError) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-card text-center">
        <CardContent className="p-8 space-y-4">
          <XCircle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">{guardError}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} className="rounded-xl">Try Again</Button>
            <Button variant="outline" onClick={() => navigate("/auth-vet")} className="rounded-xl">Go to Login</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (guardLoading) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
    </div>
  );

  // Show blocking loader only on very first load
  if (isLoading && !vetProfile && appointments.length === 0 && earnings.length === 0 && reviews.length === 0) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
      </div>
    </div>
  );

  if (activeTab === "overview") {
    return (
      <VetDashboardHome
        profile={profile}
        vetProfile={vetProfile}
        appointments={appointments}
        earnings={earnings}
        onTabChange={setActiveTab}
      />
    );
  }

  if (activeTab === "video-consultations") {
    return (
      <VetVideoConsultations
        appointments={appointments}
        onBack={() => setActiveTab("overview")}
        onTabChange={setActiveTab}
      />
    );
  }

  if (activeTab === "schedule") {
    return (
      <VetSchedule
        appointments={appointments}
        onTabChange={setActiveTab}
      />
    );
  }

  if (activeTab === "earnings") {
    return (
      <VetEarnings
        earnings={earnings}
        appointments={appointments}
        onTabChange={setActiveTab}
      />
    );
  }

  if (activeTab === "profile") {
    return (
      <VetProfile
        profile={profile}
        vetProfile={vetProfile}
        earnings={earnings}
        reviews={reviews}
        onTabChange={setActiveTab}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
              <p className="text-xs text-muted-foreground">Vet Doctor Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderProfileDropdown />
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="w-5 h-5" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-muted/50 rounded-2xl p-1 mb-6 flex flex-wrap h-auto">
            <TabsTrigger value="overview" className="flex-1 rounded-xl text-xs"><BarChart3 className="w-3 h-3 mr-1" />Overview</TabsTrigger>
            <TabsTrigger value="appointments" className="flex-1 rounded-xl text-xs relative">
              <Calendar className="w-3 h-3 mr-1" />Appointments
              {todayAppointments.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{todayAppointments.length}</span>}
            </TabsTrigger>
            <TabsTrigger value="earnings" className="flex-1 rounded-xl text-xs"><DollarSign className="w-3 h-3 mr-1" />Earnings</TabsTrigger>
            <TabsTrigger value="reviews" className="flex-1 rounded-xl text-xs"><Star className="w-3 h-3 mr-1" />Reviews</TabsTrigger>
            <TabsTrigger value="profile" className="flex-1 rounded-xl text-xs"><User className="w-3 h-3 mr-1" />Profile</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Today's Appointments", value: todayAppointments.length, icon: Calendar, color: "bg-blue-100 text-blue-600" },
                { label: "Online Upcoming", value: upcomingOnline.length, icon: Video, color: "bg-teal-100 text-teal-600" },
                { label: "Offline Upcoming", value: upcomingOffline.length, icon: MapPin, color: "bg-orange-100 text-orange-600" },
                { label: "This Month Earnings", value: `₹${thisMonthEarnings.toFixed(0)}`, icon: TrendingUp, color: "bg-green-100 text-green-600" },
              ].map(s => (
                <Card key={s.label} className="border-0 shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { label: "Wallet Balance", value: `₹${vetProfile?.wallet_balance || 0}`, icon: Wallet, color: "bg-purple-100 text-purple-600" },
                { label: "Avg Rating", value: avgRating, icon: Star, color: "bg-yellow-100 text-yellow-600" },
                { label: "Total Consultations", value: vetProfile?.total_consultations || appointments.filter(a => a.status === "completed").length, icon: Stethoscope, color: "bg-pink-100 text-pink-600" },
              ].map(s => (
                <Card key={s.label} className="border-0 shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                        <s.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xl font-bold">{s.value}</p>
                        <p className="text-[10px] text-muted-foreground">{s.label}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Appointments */}
          <TabsContent value="appointments">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>Manage all your consultations</CardDescription>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No appointments yet. They'll appear here when users book consultations.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map(apt => (
                      <div key={apt.id} className="border border-border rounded-2xl p-4 hover:shadow-md transition-all">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold">{apt.pet_name}</h4>
                            <p className="text-sm text-muted-foreground">{apt.pet_type} {apt.pet_breed && `• ${apt.pet_breed}`}</p>
                          </div>
                          {getStatusBadge(apt.status)}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-3">
                          <span className="flex items-center gap-1">
                            {apt.appointment_type === "online" ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                            {apt.appointment_type === "online" ? "Video Call" : "Clinic Visit"}
                          </span>
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{apt.appointment_date}</span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{apt.appointment_time}</span>
                          <span className="font-semibold text-foreground">₹{apt.amount}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {apt.status === "pending" && (
                            <>
                              <Button size="sm" className="rounded-xl bg-teal-500 hover:bg-teal-600 text-white" onClick={() => updateAppointmentStatus(apt.id, "confirmed")}>
                                <CheckCircle className="w-3 h-3 mr-1" />Accept
                              </Button>
                              <Button size="sm" variant="outline" className="rounded-xl text-destructive" onClick={() => updateAppointmentStatus(apt.id, "cancelled")}>
                                <XCircle className="w-3 h-3 mr-1" />Reject
                              </Button>
                            </>
                          )}
                          {apt.status === "confirmed" && apt.appointment_type === "online" && (
                            <Button size="sm" className="rounded-xl bg-blue-500 hover:bg-blue-600 text-white" onClick={() => navigate("/vet/video-call")}>
                              <Video className="w-3 h-3 mr-1" />Start Call
                            </Button>
                          )}
                          {apt.status === "confirmed" && (
                            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => {
                              setSelectedAppointment(apt);
                              setConsultationNotes({ diagnosis: apt.diagnosis || "", medicines: apt.medicines || "", care_instructions: apt.care_instructions || "" });
                              setNotesDialog(true);
                            }}>
                              <MessageSquare className="w-3 h-3 mr-1" />Complete & Add Notes
                            </Button>
                          )}
                          {apt.status === "confirmed" && apt.reschedule_count < 2 && (
                            <Button size="sm" variant="ghost" className="rounded-xl text-xs" onClick={async () => {
                              await supabase.from("vet_appointments").update({ status: "rescheduled", reschedule_count: (apt.reschedule_count || 0) + 1 }).eq("id", apt.id);
                              toast.success("Marked as rescheduled"); fetchAll(true);
                            }}>Reschedule</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Earnings */}
          <TabsContent value="earnings">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Earnings & Payouts</CardTitle>
                <CardDescription>Track your consultation earnings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 rounded-2xl p-4">
                    <p className="text-xs text-muted-foreground">Total Earned</p>
                    <p className="text-2xl font-bold text-green-700">₹{earnings.reduce((s, e) => s + Number(e.amount), 0).toFixed(0)}</p>
                  </div>
                  <div className="bg-teal-50 rounded-2xl p-4">
                    <p className="text-xs text-muted-foreground">Net After Commission</p>
                    <p className="text-2xl font-bold text-teal-700">₹{earnings.reduce((s, e) => s + Number(e.net_amount), 0).toFixed(0)}</p>
                  </div>
                </div>
                {earnings.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No earnings yet. Complete consultations to start earning.</p>
                ) : (
                  <div className="space-y-3">
                    {earnings.map(e => (
                      <div key={e.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
                        <div>
                          <p className="font-medium text-sm">₹{Number(e.amount).toFixed(0)}</p>
                          <p className="text-xs text-muted-foreground">Commission: ₹{Number(e.commission).toFixed(0)} | Net: ₹{Number(e.net_amount).toFixed(0)}</p>
                        </div>
                        <Badge className={`border-0 ${e.payout_status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                          {e.payout_status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reviews */}
          <TabsContent value="reviews">
            <Card className="border-0 shadow-card">
              <CardHeader>
                <CardTitle>Ratings & Reviews</CardTitle>
                <CardDescription>Feedback from your patients</CardDescription>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No reviews yet.</p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => (
                      <div key={r.id} className="border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star key={i} className={`w-4 h-4 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-muted"}`} />
                          ))}
                          <span className="text-sm font-medium ml-2">{r.rating}/5</span>
                        </div>
                        {r.review_text && <p className="text-sm text-muted-foreground">{r.review_text}</p>}
                        <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile">
            <Card className="border-0 shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>My Profile</CardTitle>
                  <CardDescription>Manage your vet profile</CardDescription>
                </div>
                <Button variant="outline" className="rounded-xl" onClick={() => setEditProfileDialog(true)}>
                  <Edit className="w-4 h-4 mr-1" />Edit
                </Button>
              </CardHeader>
              <CardContent>
                {vetProfile && (
                  <div className="space-y-4">
                    <div className="bg-teal-50 rounded-2xl p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">Qualification:</span><p className="font-medium">{vetProfile.qualification}</p></div>
                        <div><span className="text-muted-foreground">Experience:</span><p className="font-medium">{vetProfile.years_of_experience} years</p></div>
                        <div><span className="text-muted-foreground">Specializations:</span><p className="font-medium">{vetProfile.specializations?.join(", ")}</p></div>
                        <div><span className="text-muted-foreground">Consultation:</span><p className="font-medium capitalize">{vetProfile.consultation_type}</p></div>
                        <div><span className="text-muted-foreground">Online Fee:</span><p className="font-medium">₹{vetProfile.online_fee}</p></div>
                        <div><span className="text-muted-foreground">Offline Fee:</span><p className="font-medium">₹{vetProfile.offline_fee}</p></div>
                        <div><span className="text-muted-foreground">Available:</span><p className="font-medium">{vetProfile.available_days?.join(", ")}</p></div>
                        <div><span className="text-muted-foreground">Reg. Number:</span><p className="font-medium">{vetProfile.registration_number}</p></div>
                      </div>
                    </div>
                    {vetProfile.clinic_address && (
                      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-xl">
                        <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
                        <p className="text-sm">{vetProfile.clinic_address}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Consultation Notes Dialog */}
      <Dialog open={notesDialog} onOpenChange={setNotesDialog}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Consultation Notes</DialogTitle>
            <DialogDescription>Add diagnosis and treatment details for {selectedAppointment?.pet_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Textarea value={consultationNotes.diagnosis} onChange={e => setConsultationNotes({...consultationNotes, diagnosis: e.target.value})} placeholder="Enter diagnosis..." className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Medicines Suggested</Label>
              <Textarea value={consultationNotes.medicines} onChange={e => setConsultationNotes({...consultationNotes, medicines: e.target.value})} placeholder="List medicines..." className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Care Instructions</Label>
              <Textarea value={consultationNotes.care_instructions} onChange={e => setConsultationNotes({...consultationNotes, care_instructions: e.target.value})} placeholder="Post-consultation care..." className="rounded-xl" />
            </div>
            <Button className="w-full rounded-xl bg-gradient-primary" onClick={saveConsultationNotes}>
              <CheckCircle className="w-4 h-4 mr-2" />Complete Consultation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileDialog} onOpenChange={setEditProfileDialog}>
        <DialogContent className="rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Online Fee (₹)</Label>
                <Input type="number" value={editData.online_fee || ""} onChange={e => setEditData({...editData, online_fee: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Offline Fee (₹)</Label>
                <Input type="number" value={editData.offline_fee || ""} onChange={e => setEditData({...editData, offline_fee: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Clinic Address</Label>
              <Input value={editData.clinic_address || ""} onChange={e => setEditData({...editData, clinic_address: e.target.value})} className="rounded-xl" placeholder="Enter clinic address" />
            </div>
            <div className="space-y-2">
              <Label>Consultation Type</Label>
              <Select value={editData.consultation_type || "both"} onValueChange={v => setEditData({...editData, consultation_type: v})}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online Only</SelectItem>
                  <SelectItem value="offline">Offline Only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full rounded-xl bg-gradient-primary" onClick={updateVetProfile}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VetDashboard;
