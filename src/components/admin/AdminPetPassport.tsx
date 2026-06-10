import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Search, Eye, FileText, Phone, User, ShieldCheck, Heart, Clock,
  Calendar, Award, Activity, AlertCircle, FileDigit, Sparkles, Ban
} from "lucide-react";

interface PetPassport {
  id: string;
  passport_id: string;
  pet_name: string;
  species: string;
  gender: string;
  breed: string;
  appearance: string | null;
  age_type: string | null;
  dob: string | null;
  approx_years: number | null;
  approx_months: number | null;
  weight: number | null;
  owner_name: string;
  primary_phone: string;
  emergency_contact_name: string | null;
  emergency_phone: string | null;
  emergency_relationship: string | null;
  photo_url: string | null;
  created_at: string;
}

interface MedicalLog {
  id: string;
  pet_passport_id: string;
  last_vaccination_date: string | null;
  known_allergies: string | null;
  last_veterinary_visit: string | null;
}

interface HealthCondition {
  id: string;
  pet_passport_id: string;
  condition_name: string;
  specify_other: string | null;
}

interface HealthRecordDocument {
  id: string;
  pet_passport_id: string;
  record_type: string;
  vaccine_name: string | null;
  specify_vaccine: string | null;
  date_administered: string | null;
  next_due_date: string | null;
  diagnosis: string | null;
  prescribed_by: string | null;
  issue_date: string | null;
  test_name: string | null;
  test_date: string | null;
  procedure_name: string | null;
  surgery_date: string | null;
  condition_name: string | null;
  certificate_title: string | null;
  record_description: string | null;
  document_base64: string | null;
}

const AdminPetPassport = () => {
  const [passports, setPassports] = useState<PetPassport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Real-time notification indicator
  const [showLiveBadge, setShowLiveBadge] = useState(false);

  // Detail Modal States
  const [selectedPassport, setSelectedPassport] = useState<PetPassport | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedMedical, setSelectedMedical] = useState<MedicalLog | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<HealthCondition[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<HealthRecordDocument[]>([]);

  const fetchPassports = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pet_passports")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPassports((data || []) as PetPassport[]);
    } catch (err) {
      console.error("Error fetching pet passports:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassports();

    // Subscribe to real-time additions/modifications of pet passports
    const channel = supabase.channel("admin-realtime-passports")
      .on("postgres_changes", { event: "*", schema: "public", table: "pet_passports" }, (payload) => {
        console.log("Realtime pet-passport change received:", payload);
        fetchPassports(true);
        
        // Show live notification badge on incoming data
        if (payload.eventType === "INSERT") {
          setShowLiveBadge(true);
          const t = setTimeout(() => setShowLiveBadge(false), 5000);
          return () => clearTimeout(t);
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pet_medical_logs" }, () => {
        fetchPassports(true);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pet_health_conditions" }, () => {
        fetchPassports(true);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "pet_health_records_documents" }, () => {
        fetchPassports(true);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const openPassportDetails = async (passport: PetPassport) => {
    setSelectedPassport(passport);
    setModalLoading(true);

    try {
      // Fetch details using direct tables
      const [medicalRes, conditionsRes, recordsRes] = await Promise.all([
        supabase
          .from("pet_medical_logs")
          .select("*")
          .eq("pet_passport_id", passport.id)
          .maybeSingle(),
        supabase
          .from("pet_health_conditions")
          .select("*")
          .eq("pet_passport_id", passport.id),
        supabase
          .from("pet_health_records_documents")
          .select("*")
          .eq("pet_passport_id", passport.id)
      ]);

      setSelectedMedical(medicalRes.data as MedicalLog | null);
      setSelectedConditions((conditionsRes.data || []) as HealthCondition[]);
      setSelectedRecords((recordsRes.data || []) as HealthRecordDocument[]);
    } catch (err) {
      console.error("Error loading passport detailed logs:", err);
    } finally {
      setModalLoading(false);
    }
  };

  const filteredPassports = passports.filter((p) => {
    if (!search) return true;
    const query = search.toLowerCase();
    return (
      p.pet_name?.toLowerCase().includes(query) ||
      p.passport_id?.toLowerCase().includes(query) ||
      p.breed?.toLowerCase().includes(query) ||
      p.owner_name?.toLowerCase().includes(query) ||
      p.primary_phone?.includes(query)
    );
  });

  // Calculate quick metrics
  const totalPassports = passports.length;
  const dogsCount = passports.filter((p) => p.species?.toLowerCase() === "dog").length;
  const catsCount = passports.filter((p) => p.species?.toLowerCase() === "cat").length;
  const othersCount = totalPassports - dogsCount - catsCount;

  return (
    <div className="space-y-6">
      {/* Header and Live Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[hsl(220,20%,15%)] flex items-center gap-2">
            Pet Passports Dashboard
            <span className="relative flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
            </span>
          </h2>
          <p className="text-sm text-[hsl(220,15%,55%)]">
            Monitor, track, and inspect all digital pet passports emitted by Sruvo in real-time.
          </p>
        </div>

        {showLiveBadge && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-1.5 rounded-full flex items-center gap-2 animate-bounce self-start sm:self-center shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 block"></span>
            <span>New Pet Passport Sync Completed Live!</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 border-0 shadow-sm rounded-2xl bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[hsl(220,15%,50%)] uppercase tracking-wider">Total Passports</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-[hsl(220,20%,15%)]">{totalPassports}</span>
            <p className="text-[11px] text-emerald-600 font-medium mt-1">Live active identities</p>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm rounded-2xl bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[hsl(220,15%,50%)] uppercase tracking-wider">Dogs Issued</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-[hsl(220,20%,15%)]">{dogsCount}</span>
            <p className="text-[11px] text-[hsl(220,15%,55%)] mt-1">
              {totalPassports > 0 ? Math.round((dogsCount / totalPassports) * 100) : 0}% of total
            </p>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm rounded-2xl bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[hsl(220,15%,50%)] uppercase tracking-wider">Cats Issued</span>
            <div className="p-2 rounded-xl bg-pink-50 text-pink-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-[hsl(220,20%,15%)]">{catsCount}</span>
            <p className="text-[11px] text-[hsl(220,15%,55%)] mt-1">
              {totalPassports > 0 ? Math.round((catsCount / totalPassports) * 100) : 0}% of total
            </p>
          </div>
        </Card>

        <Card className="p-4 border-0 shadow-sm rounded-2xl bg-white flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[hsl(220,15%,50%)] uppercase tracking-wider">Other Species</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-bold text-[hsl(220,20%,15%)]">{othersCount}</span>
            <p className="text-[11px] text-[hsl(220,15%,55%)] mt-1">Birds, Rabbits, Exotics</p>
          </div>
        </Card>
      </div>

      {/* Control Actions & Searching */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,55%)]" />
        <Input
          placeholder="Search by pet name, Sruvo ID, breed, or owner..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl border-[hsl(220,20%,90%)] bg-white shadow-sm font-medium"
        />
      </div>

      {/* Main List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(220,80%,50%)]" />
        </div>
      ) : filteredPassports.length === 0 ? (
        <Card className="p-16 border-0 shadow-sm rounded-2xl text-center bg-white">
          <FileText className="w-14 h-14 mx-auto text-[hsl(220,15%,75%)] mb-4" />
          <h3 className="text-md font-semibold text-slate-800">No Pet Passports Found</h3>
          <p className="text-sm text-[hsl(220,15%,55%)] mt-1">
            Either no passports matches search criteria, or no users have registered a pet passport yet.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPassports.map((p) => {
            const isDog = p.species?.toLowerCase() === "dog";
            const isCat = p.species?.toLowerCase() === "cat";
            
            return (
              <Card
                key={p.id}
                className="group border-0 shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden cursor-pointer bg-white relative flex flex-col justify-between"
                onClick={() => openPassportDetails(p)}
              >
                {/* Visual Accent Bar */}
                <div className={`h-1.5 w-full ${isDog ? "bg-amber-400" : isCat ? "bg-pink-400" : "bg-emerald-400"}`} />

                <div className="p-5 flex-1 flex flex-col justify-between">
                  {/* Card Main Information */}
                  <div className="flex items-start gap-4">
                    {/* Pet Image / Circle */}
                    <div className="relative w-14 h-14 rounded-2xl border bg-slate-50 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                      {p.photo_url ? (
                        <img
                          src={p.photo_url}
                          alt={p.pet_name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-lg font-bold text-slate-400">
                          {p.pet_name?.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Sruvo ID & Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-base text-slate-800 truncate group-hover:text-[hsl(220,80%,50%)] transition-colors">
                          {p.pet_name}
                        </h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          p.gender?.toLowerCase() === "male" 
                            ? "bg-blue-50 text-blue-700 border border-blue-100" 
                            : "bg-pink-50 text-pink-700 border border-pink-100"
                        }`}>
                          {p.gender}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {p.breed} • {p.species}
                      </p>
                      
                      <div className="mt-2.5 inline-flex items-center justify-center bg-indigo-50 border border-indigo-100/50 px-2.5 py-0.5 rounded-lg">
                        <span className="font-mono text-[9px] font-bold tracking-wider text-indigo-700">
                          {p.passport_id}
                        </span>
                      </div>
                    </div>
                  </div>

                  <hr className="my-4 border-slate-100" />

                  {/* Owner Grid Metadata */}
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium shrink-0">
                        <User className="w-3.5 h-3.5" /> Owner:
                      </span>
                      <span className="font-semibold text-slate-700 truncate text-right ml-2">
                        {p.owner_name}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium shrink-0">
                        <Phone className="w-3.5 h-3.5" /> Mobile:
                      </span>
                      <span className="font-semibold text-slate-700">
                        {p.primary_phone}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-500">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5" /> Registered:
                      </span>
                      <span className="font-medium text-slate-400">
                        {new Date(p.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Foot Card Call-to-action */}
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">ID: {p.id}</span>
                    <button className="text-xs font-semibold text-[hsl(220,80%,50%)] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Inspect Passport <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Inspection Detailed View Dialog */}
      <Dialog open={!!selectedPassport} onOpenChange={() => setSelectedPassport(null)}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl p-0 border-0 bg-[hsl(220,20%,98%)] shadow-2xl">
          {selectedPassport && (
            <>
              {/* Brand Top Header Card */}
              <div className="relative p-6 bg-white border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 shrink-0 shadow-inner border border-slate-100 flex items-center justify-center">
                    {selectedPassport.photo_url ? (
                      <img
                        src={selectedPassport.photo_url}
                        alt=""
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-2xl font-extrabold text-slate-400">
                        {selectedPassport.pet_name?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xl font-extrabold text-slate-800">
                        {selectedPassport.pet_name}
                      </h3>
                      <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-100/50">
                        {selectedPassport.passport_id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      {selectedPassport.breed || "Unknown Breed"} • {selectedPassport.species} • {selectedPassport.gender}
                    </p>
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5" /> Sruvo Verified
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-1.5">
                    Registered On: {new Date(selectedPassport.created_at).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>

              {modalLoading ? (
                <div className="flex justify-center p-24">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(220,80%,50%)]" />
                </div>
              ) : (
                <div className="p-6">
                  <Tabs defaultValue="identity" className="w-full">
                    <TabsList className="w-full rounded-2xl bg-slate-100 p-1 mb-6 border border-slate-200/50">
                      <TabsTrigger value="identity" className="flex-1 rounded-xl text-xs py-2.5 font-bold">
                        1. Identity & Owner
                      </TabsTrigger>
                      <TabsTrigger value="medical" className="flex-1 rounded-xl text-xs py-2.5 font-bold">
                        2. Health Summary
                      </TabsTrigger>
                      <TabsTrigger value="conditions" className="flex-1 rounded-xl text-xs py-2.5 font-bold">
                        3. Conditions ({selectedConditions.length})
                      </TabsTrigger>
                      <TabsTrigger value="records" className="flex-1 rounded-xl text-xs py-2.5 font-bold">
                        4. Documents ({selectedRecords.length})
                      </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Identity & Owner */}
                    <TabsContent value="identity" className="space-y-6 focus:outline-none focus-visible:ring-0">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Pet Physical Characteristics */}
                        <Card className="p-5 border-0 shadow-sm rounded-2xl bg-white space-y-4">
                          <h4 className="text-sm font-bold text-slate-700 border-b pb-2 flex items-center gap-1.5">
                            <Activity className="w-4 h-4 text-indigo-500" /> Physical Description
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="text-slate-400 mb-0.5">Species</p>
                              <p className="font-bold text-slate-700 capitalize">{selectedPassport.species}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-0.5">Breed</p>
                              <p className="font-bold text-slate-700 capitalize">{selectedPassport.breed || "None Recorded"}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-0.5">Gender</p>
                              <p className="font-bold text-slate-700 capitalize">{selectedPassport.gender}</p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-0.5">Weight</p>
                              <p className="font-bold text-slate-700">
                                {selectedPassport.weight ? `${selectedPassport.weight} Kg` : "Not Stated"}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400 mb-0.5">Age Reference</p>
                              {selectedPassport.age_type === "dob" ? (
                                <p className="font-bold text-slate-700 flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" /> 
                                  {selectedPassport.dob ? new Date(selectedPassport.dob).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                                </p>
                              ) : (
                                <p className="font-bold text-slate-700">
                                  {selectedPassport.approx_years || 0} Years, {selectedPassport.approx_months || 0} Months (Approx)
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="pt-2 text-xs">
                            <p className="text-slate-400 mb-0.5">Appearance / Distinctive Marks</p>
                            <p className="italic font-semibold text-slate-600 bg-slate-50 border border-slate-100 p-3 rounded-lg leading-relaxed">
                              {selectedPassport.appearance || "No distinctive visual earmarks compiled."}
                            </p>
                          </div>
                        </Card>

                        {/* Owner & Emergency Contact Card */}
                        <Card className="p-5 border-0 shadow-sm rounded-2xl bg-white space-y-4">
                          <h4 className="text-sm font-bold text-slate-700 border-b pb-2 flex items-center gap-1.5">
                            <User className="w-4 h-4 text-emerald-500" /> Custodian Information
                          </h4>

                          <div className="space-y-4 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border">
                                <User className="w-4 h-4 text-slate-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-400 text-[10px]">Primary Caregiver</p>
                                <p className="font-bold text-slate-800">{selectedPassport.owner_name}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border">
                                <Phone className="w-4 h-4 text-slate-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-slate-400 text-[10px]">Mobile Contact</p>
                                <p className="font-bold text-slate-800 tracking-wider">{selectedPassport.primary_phone}</p>
                              </div>
                            </div>

                            <div className="border-t border-dashed border-slate-100 pt-3 space-y-3">
                              <p className="font-bold text-slate-600 uppercase text-[10px] tracking-wider">Emergency Backups</p>

                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-slate-400 mb-0.5">Alt Contact Name</p>
                                  <p className="font-bold text-slate-700">
                                    {selectedPassport.emergency_contact_name || "Unassigned"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-400 mb-0.5">Alt Connection</p>
                                  <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded">
                                    {selectedPassport.emergency_relationship || "N/A"}
                                  </span>
                                </div>
                                <div className="col-span-2">
                                  <p className="text-slate-400 mb-0.5">Emergency Phone</p>
                                  <p className="font-bold text-slate-700 tracking-wider">
                                    {selectedPassport.emergency_phone || "Not specified"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* Tab 2: Medical Logs */}
                    <TabsContent value="medical" className="space-y-6 focus:outline-none focus-visible:ring-0">
                      <Card className="p-6 border-0 shadow-sm rounded-2xl bg-white space-y-6">
                        <div className="flex items-center justify-between border-b pb-3">
                          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-pink-500" /> Quick Vaccination & Medical Summary
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400">LOG REFS_ID: {selectedMedical?.id || "None"}</span>
                        </div>

                        {selectedMedical ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 rounded-xl bg-pink-50/50 border border-pink-100/30 flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-pink-50 text-pink-600 text-xs mt-0.5 font-bold">Vax</div>
                              <div>
                                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Last Vaccination Date</p>
                                <p className="font-extrabold text-slate-800 text-sm mt-0.5">
                                  {selectedMedical.last_vaccination_date 
                                    ? new Date(selectedMedical.last_vaccination_date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                                    : "No records filled out"}
                                </p>
                              </div>
                            </div>

                            <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100/30 flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 text-xs mt-0.5 font-bold">Doc</div>
                              <div>
                                <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Last Veterinary Visit</p>
                                <p className="font-extrabold text-slate-800 text-sm mt-0.5">
                                  {selectedMedical.last_veterinary_visit 
                                    ? new Date(selectedMedical.last_veterinary_visit).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
                                    : "No record found"}
                                </p>
                              </div>
                            </div>

                            <div className="md:col-span-2 p-5 bg-amber-50/50 border border-amber-100/50 rounded-2xl flex gap-3">
                              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <p className="text-amber-800 font-bold text-xs">Primary Known Allergies & Tolerances</p>
                                <p className="text-amber-700/90 text-xs leading-relaxed font-semibold">
                                  {selectedMedical.known_allergies || "No active, high-priority, or life-threatening systemic allergies or food sensitivities noted by the custodian."}
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-xs text-slate-400">
                            No active medical timeline records synched to this companion identity yet.
                          </div>
                        )}
                      </Card>
                    </TabsContent>

                    {/* Tab 3: Conditions List */}
                    <TabsContent value="conditions" className="space-y-4 focus:outline-none focus-visible:ring-0">
                      {selectedConditions.length === 0 ? (
                        <Card className="p-12 border-0 shadow-sm rounded-2xl text-center bg-white">
                          <Ban className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-600 font-semibold text-sm">Perfect Bill of Health</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            No special medical considerations, chronic symptoms, physical therapy regimes, or conditions declared.
                          </p>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {selectedConditions.map((c) => (
                            <Card key={c.id} className="p-4 border-0 shadow-sm rounded-xl bg-white flex items-start gap-3">
                              <div className="p-2 rounded-full bg-red-50 text-red-600 mt-0.5 shrink-0">
                                <AlertCircle className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 text-sm">{c.condition_name}</p>
                                {c.specify_other && (
                                  <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 p-2.5 rounded-lg mt-1.5 leading-relaxed font-medium">
                                    <span className="font-bold text-slate-700 block text-[10px] uppercase mb-0.5">Details:</span>
                                    {c.specify_other}
                                  </p>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>

                    {/* Tab 4: Records Documents */}
                    <TabsContent value="records" className="space-y-4 focus:outline-none focus-visible:ring-0">
                      {selectedRecords.length === 0 ? (
                        <Card className="p-12 border-0 shadow-sm rounded-2xl text-center bg-white">
                          <FileDigit className="w-10 h-10 mx-auto text-slate-300 mb-3" />
                          <p className="text-slate-600 font-semibold text-sm">No Health Logs Attached</p>
                          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                            The owner has not attached physical copies, pdfs, pictures, or vaccine certifications to the digital passport.
                          </p>
                        </Card>
                      ) : (
                        <div className="space-y-4">
                          {selectedRecords.map((r, index) => (
                            <Card key={r.id || index} className="p-5 border-0 shadow-sm rounded-2xl bg-white space-y-4">
                              <div className="flex items-center justify-between border-b pb-2.5">
                                <div className="flex items-center gap-2">
                                  <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold font-mono">
                                    {r.record_type ? r.record_type.toUpperCase() : "DOC"}
                                  </span>
                                  <h5 className="font-extrabold text-slate-800 text-sm">
                                    {r.certificate_title || r.vaccine_name || r.procedure_name || r.test_name || r.diagnosis || "Health Record Paper"}
                                  </h5>
                                </div>
                                <span className="text-[10px] font-medium text-slate-400">Ref Entry: #{index + 1}</span>
                              </div>

                              {/* Formatted metadata according to record properties */}
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 text-xs font-medium">
                                {r.vaccine_name && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Vaccine Name</p>
                                    <p className="text-slate-700 font-bold">{r.vaccine_name}</p>
                                  </div>
                                )}
                                {r.specify_vaccine && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Specified SubVaccine</p>
                                    <p className="text-slate-700 font-bold">{r.specify_vaccine}</p>
                                  </div>
                                )}
                                {r.date_administered && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Date Administered</p>
                                    <p className="text-slate-700 font-semibold">
                                      {new Date(r.date_administered).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                  </div>
                                )}
                                {r.next_due_date && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Next Due Date</p>
                                    <p className="text-red-500 font-bold">
                                      {new Date(r.next_due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                  </div>
                                )}
                                {r.diagnosis && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Diagnosis Verdict</p>
                                    <p className="text-slate-700 font-bold">{r.diagnosis}</p>
                                  </div>
                                )}
                                {r.prescribed_by && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Prescribing Medical Officer</p>
                                    <p className="text-slate-700 font-bold">{r.prescribed_by}</p>
                                  </div>
                                )}
                                {r.issue_date && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Issue Date</p>
                                    <p className="text-slate-700 font-semibold">
                                      {new Date(r.issue_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                  </div>
                                )}
                                {r.procedure_name && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Procedure Title</p>
                                    <p className="text-slate-700 font-bold">{r.procedure_name}</p>
                                  </div>
                                )}
                                {r.surgery_date && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Surgery Scheduled Date</p>
                                    <p className="text-slate-700 font-semibold">
                                      {new Date(r.surgery_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                  </div>
                                )}
                                {r.test_name && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Lab Diagnostic Test</p>
                                    <p className="text-slate-700 font-bold">{r.test_name}</p>
                                  </div>
                                )}
                                {r.test_date && (
                                  <div>
                                    <p className="text-slate-400 text-[10px]">Test Evaluated Date</p>
                                    <p className="text-slate-700 font-semibold">
                                      {new Date(r.test_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {r.record_description && (
                                <div className="text-xs bg-slate-50 border border-slate-100 p-3 rounded-lg leading-relaxed text-slate-600 font-medium">
                                  <span className="font-bold text-slate-700 text-[10px] uppercase block mb-1">Clinic Description Log</span>
                                  {r.record_description}
                                </div>
                              )}

                              {/* Base 64 Document View/Download */}
                              {r.document_base64 && (
                                <div className="pt-2">
                                  <a
                                    href={r.document_base64}
                                    download={`${selectedPassport.pet_name}_health_record_${r.record_type || 'doc'}.png`}
                                    className="inline-flex items-center gap-2 text-xs font-bold text-[hsl(220,80%,50%)] hover:underline"
                                  >
                                    <FileText className="w-4 h-4" /> Download Base64 Document Attachment
                                  </a>
                                </div>
                              )}
                            </Card>
                          ))}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Modal Close CTA */}
                  <div className="mt-8 flex justify-end">
                    <Button
                      variant="outline"
                      className="rounded-xl font-semibold bg-white border-slate-200"
                      onClick={() => setSelectedPassport(null)}
                    >
                      Close Inspection Window
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPetPassport;
