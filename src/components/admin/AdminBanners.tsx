import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, Upload, X, Image as ImageIcon, MonitorSmartphone } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  gradient: string;
  cta_text: string;
  cta_link: string;
  link_url: string;
  location: string;
  target_route: string;
  banner_style: string;
  custom_width: string;
  custom_height: string;
  placement: string;
  border_radius: string;
  position: number;
  is_active: boolean;
  created_at: string;
}

const LOCATIONS = [
  { id: "shop_home", label: "Shop Home Carousel" },
  { id: "pet_shop", label: "Pet Shop Banner" },
  { id: "buyer_home", label: "Buyer Home Carousel" },
  { id: "custom", label: "Custom (Any Route)" },
];

const BANNER_STYLES = [
  { id: "carousel", label: "Carousel Slide", desc: "Part of existing carousel" },
  { id: "full_width", label: "Full Width Banner", desc: "Spans entire width" },
  { id: "card", label: "Card Banner", desc: "Compact card style" },
  { id: "strip", label: "Thin Strip", desc: "Announcement-style strip" },
  { id: "custom", label: "Custom Size", desc: "Set your own dimensions" },
];

const PLACEMENTS = [
  { id: "top", label: "Top of page" },
  { id: "bottom", label: "Bottom of content" },
];

const ROUTE_SUGGESTIONS = [
  { route: "/buyer-dashboard", label: "Buyer Home" },
  { route: "/shop", label: "Shop Page" },
  { route: "/cart", label: "Cart Page" },
  { route: "/vet", label: "Vet Page" },
  { route: "/pet/*", label: "All Pet Details" },
  { route: "/product/*", label: "All Product Pages" },
  { route: "/profile-menu", label: "Profile Menu" },
  { route: "/wishlist", label: "Wishlist" },
  { route: "/chats", label: "Chats" },
  { route: "*", label: "All Pages (Global)" },
];

const GRADIENT_PRESETS = [
  "linear-gradient(135deg, #7c3aed, #a855f7, #ec4899)",
  "linear-gradient(135deg, #0ea5e9, #6366f1, #8b5cf6)",
  "linear-gradient(135deg, #f59e0b, #ef4444, #ec4899)",
  "linear-gradient(135deg, #10b981, #14b8a6, #0ea5e9)",
  "linear-gradient(135deg, #ec4899, #f43f5e, #f59e0b)",
  "linear-gradient(135deg, #1e293b, #334155, #475569)",
];

const SIZE_PRESETS = [
  { label: "Full Banner", w: "100%", h: "160px", r: "16px" },
  { label: "Compact", w: "100%", h: "100px", r: "12px" },
  { label: "Strip", w: "100%", h: "48px", r: "8px" },
  { label: "Card", w: "90%", h: "140px", r: "20px" },
  { label: "Square", w: "200px", h: "200px", r: "16px" },
  { label: "Wide", w: "100%", h: "200px", r: "16px" },
];

const CTA_ALIGNMENTS = [
  { id: "left", label: "Left", icon: "◀" },
  { id: "center", label: "Center", icon: "●" },
  { id: "right", label: "Right", icon: "▶" },
];

const emptyBanner = {
  title: "", subtitle: "", image_url: "", gradient: GRADIENT_PRESETS[0],
  cta_text: "Shop Now", cta_link: "", link_url: "", location: "custom",
  target_route: "/buyer-dashboard", banner_style: "full_width",
  custom_width: "100%", custom_height: "160px", placement: "top",
  border_radius: "16px", position: 0, is_active: true, cta_alignment: "left",
};

const AdminBanners = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterLocation, setFilterLocation] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyBanner);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { fetchBanners(); }, []);

  const fetchBanners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("banners")
      .select("*")
      .order("location")
      .order("position");
    if (error) {
      console.error("Banner fetch error:", error);
      toast({ title: "Error fetching banners", description: error.message, variant: "destructive" });
    }
    setBanners((data as Banner[]) || []);
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `banners/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("banner-images").upload(path, file);
    if (error) {
      toast({ title: "Upload failed", variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("banner-images").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title && !form.image_url) {
      toast({ title: "Title or image required", variant: "destructive" });
      return;
    }

    const payload = {
      title: form.title, subtitle: form.subtitle, image_url: form.image_url,
      gradient: form.gradient, cta_text: form.cta_text, cta_link: form.cta_link,
      link_url: form.link_url, location: form.location, target_route: form.target_route,
      banner_style: form.banner_style, custom_width: form.custom_width,
      custom_height: form.custom_height, placement: form.placement,
      border_radius: form.border_radius, position: form.position, is_active: form.is_active,
      cta_alignment: form.cta_alignment,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase.from("banners").update(payload).eq("id", editingId);
      if (error) toast({ title: "Update failed", variant: "destructive" });
      else toast({ title: "Banner updated" });
    } else {
      const { error } = await supabase.from("banners").insert(payload);
      if (error) toast({ title: "Create failed", variant: "destructive" });
      else toast({ title: "Banner created" });
    }
    setShowForm(false);
    setEditingId(null);
    setForm(emptyBanner);
    fetchBanners();
  };

  const handleEdit = (b: Banner) => {
    setForm({
      title: b.title, subtitle: b.subtitle, image_url: b.image_url,
      gradient: b.gradient, cta_text: b.cta_text, cta_link: b.cta_link || "",
      link_url: b.link_url || "", location: b.location, target_route: b.target_route || "/",
      banner_style: b.banner_style || "full_width", custom_width: b.custom_width || "100%",
      custom_height: b.custom_height || "160px", placement: b.placement || "top",
      border_radius: b.border_radius || "16px", position: b.position, is_active: b.is_active,
      cta_alignment: (b as any).cta_alignment || "left",
    });
    setEditingId(b.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", variant: "destructive" });
    else { toast({ title: "Banner deleted" }); fetchBanners(); }
  };

  const toggleActive = async (b: Banner) => {
    await supabase.from("banners").update({ is_active: !b.is_active, updated_at: new Date().toISOString() }).eq("id", b.id);
    fetchBanners();
  };

  const applySizePreset = (preset: typeof SIZE_PRESETS[0]) => {
    setForm(f => ({ ...f, custom_width: preset.w, custom_height: preset.h, border_radius: preset.r }));
  };

  const filtered = filterLocation === "all" ? banners : banners.filter(b => b.location === filterLocation);

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-xl md:text-[28px] font-bold text-[hsl(220,20%,15%)]">Advertisement Manager</h1>
          <p className="text-xs md:text-sm text-[hsl(220,15%,55%)] mt-1">Create & manage banners across all app pages — any route, any size</p>
        </div>
        <button
          onClick={() => { setForm(emptyBanner); setEditingId(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[hsl(220,80%,50%)] hover:bg-[hsl(220,80%,45%)] transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Ad
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ id: "all", label: `All (${banners.length})` }, ...LOCATIONS.map(l => ({ id: l.id, label: `${l.label} (${banners.filter(b => b.location === l.id).length})` }))].map(tab => (
          <button key={tab.id} onClick={() => setFilterLocation(tab.id)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${filterLocation === tab.id ? "bg-[hsl(220,80%,50%)] text-white" : "bg-white border border-[hsl(220,20%,88%)] text-[hsl(220,20%,30%)] hover:bg-[hsl(220,20%,96%)]"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[hsl(220,20%,15%)]">{editingId ? "Edit Advertisement" : "Create Advertisement"}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }}>
                <X className="w-5 h-5 text-[hsl(220,15%,55%)]" />
              </button>
            </div>

            <div className="space-y-5">
              {/* Target Route */}
              <div>
                <label className="text-sm font-semibold text-[hsl(220,20%,25%)] mb-2 block">📍 Where should this banner appear?</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {ROUTE_SUGGESTIONS.map(r => (
                    <button key={r.route} onClick={() => setForm(f => ({ ...f, target_route: r.route }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.target_route === r.route ? "bg-[hsl(220,80%,50%)] text-white" : "bg-[hsl(220,20%,96%)] text-[hsl(220,20%,30%)] hover:bg-[hsl(220,20%,92%)]"}`}>
                      {r.label}
                    </button>
                  ))}
                </div>
                <input value={form.target_route} onChange={e => setForm(f => ({ ...f, target_route: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-[hsl(220,20%,88%)] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(220,80%,50%)]/30"
                  placeholder="Custom route: /any-path or * for all pages" />
                <p className="text-[11px] text-[hsl(220,15%,60%)] mt-1">Use * at end for prefix match: /vet/* matches all vet pages</p>
              </div>

              {/* Banner Style */}
              <div>
                <label className="text-sm font-semibold text-[hsl(220,20%,25%)] mb-2 block">🎨 Banner Style</label>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {BANNER_STYLES.map(s => (
                    <button key={s.id} onClick={() => setForm(f => ({ ...f, banner_style: s.id, location: s.id === "carousel" ? f.location : "custom" }))}
                      className={`p-2 rounded-xl text-center transition-all border ${form.banner_style === s.id ? "border-[hsl(220,80%,50%)] bg-[hsl(220,80%,97%)]" : "border-[hsl(220,20%,90%)] hover:bg-[hsl(220,20%,97%)]"}`}>
                      <span className="text-xs font-medium block">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Size Controls */}
              {form.banner_style !== "carousel" && (
                <div>
                  <label className="text-sm font-semibold text-[hsl(220,20%,25%)] mb-2 block">📐 Size & Dimensions</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {SIZE_PRESETS.map((p, i) => (
                      <button key={i} onClick={() => applySizePreset(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${form.custom_width === p.w && form.custom_height === p.h ? "bg-[hsl(220,80%,50%)] text-white" : "bg-[hsl(220,20%,96%)] text-[hsl(220,20%,30%)]"}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-[hsl(220,15%,55%)] mb-1 block">Width</label>
                      <input value={form.custom_width} onChange={e => setForm(f => ({ ...f, custom_width: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-[hsl(220,20%,88%)] text-sm focus:outline-none" placeholder="100%" />
                    </div>
                    <div>
                      <label className="text-xs text-[hsl(220,15%,55%)] mb-1 block">Height</label>
                      <input value={form.custom_height} onChange={e => setForm(f => ({ ...f, custom_height: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-[hsl(220,20%,88%)] text-sm focus:outline-none" placeholder="160px" />
                    </div>
                    <div>
                      <label className="text-xs text-[hsl(220,15%,55%)] mb-1 block">Radius</label>
                      <input value={form.border_radius} onChange={e => setForm(f => ({ ...f, border_radius: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl border border-[hsl(220,20%,88%)] text-sm focus:outline-none" placeholder="16px" />
                    </div>
                  </div>
                </div>
              )}

              {/* Placement */}
              {form.banner_style !== "carousel" && (
                <div>
                  <label className="text-sm font-semibold text-[hsl(220,20%,25%)] mb-2 block">📌 Placement</label>
                  <div className="flex gap-2">
                    {PLACEMENTS.map(p => (
                      <button key={p.id} onClick={() => setForm(f => ({ ...f, placement: p.id }))}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${form.placement === p.id ? "border-[hsl(220,80%,50%)] bg-[hsl(220,80%,97%)] text-[hsl(220,80%,50%)]" : "border-[hsl(220,20%,90%)] text-[hsl(220,20%,30%)]"}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="text-sm font-semibold text-[hsl(220,20%,25%)] mb-2 block">🖼️ Banner Image</label>
                {form.image_url ? (
                  <div className="relative rounded-xl overflow-hidden h-32 bg-[hsl(220,20%,96%)]">
                    <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                    <button onClick={() => setForm(f => ({ ...f, image_url: "" }))}
                      className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-[hsl(220,20%,85%)] bg-[hsl(220,20%,98%)] cursor-pointer hover:bg-[hsl(220,20%,96%)]">
                    {uploading ? <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(220,80%,50%)]" /> : (
                      <><Upload className="w-7 h-7 text-[hsl(220,15%,60%)] mb-1" /><span className="text-xs text-[hsl(220,15%,55%)]">Upload image (optional)</span></>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>

              {/* Content */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[hsl(220,20%,25%)] mb-1 block">Title</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[hsl(220,20%,88%)] text-sm focus:outline-none" placeholder="Banner title" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[hsl(220,20%,25%)] mb-1 block">Subtitle</label>
                  <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[hsl(220,20%,88%)] text-sm focus:outline-none" placeholder="Subtitle text" />
                </div>
              </div>

              {/* Gradient */}
              <div>
                <label className="text-xs font-medium text-[hsl(220,20%,25%)] mb-1.5 block">Background Gradient</label>
                <div className="flex gap-2 flex-wrap mb-2">
                  {GRADIENT_PRESETS.map((g, i) => (
                    <button key={i} onClick={() => setForm(f => ({ ...f, gradient: g }))}
                      className={`w-9 h-9 rounded-xl border-2 transition-all ${form.gradient === g ? "border-[hsl(220,80%,50%)] scale-110" : "border-transparent"}`}
                      style={{ background: g }} />
                  ))}
                </div>
                <input value={form.gradient} onChange={e => setForm(f => ({ ...f, gradient: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-[hsl(220,20%,88%)] text-xs focus:outline-none" placeholder="Custom CSS gradient" />
              </div>

              {/* CTA & Link */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-[hsl(220,20%,25%)] mb-1 block">CTA Button</label>
                  <input value={form.cta_text} onChange={e => setForm(f => ({ ...f, cta_text: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[hsl(220,20%,88%)] text-sm focus:outline-none" placeholder="Shop Now" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[hsl(220,20%,25%)] mb-1 block">Click Link</label>
                  <input value={form.link_url} onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[hsl(220,20%,88%)] text-sm focus:outline-none" placeholder="/shop or URL" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[hsl(220,20%,25%)] mb-1 block">Position</label>
                  <input type="number" value={form.position} onChange={e => setForm(f => ({ ...f, position: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-[hsl(220,20%,88%)] text-sm focus:outline-none" min={0} />
                </div>
              </div>

              {/* CTA Alignment */}
              <div>
                <label className="text-sm font-semibold text-[hsl(220,20%,25%)] mb-2 block">🔘 CTA Button Alignment</label>
                <div className="flex gap-2">
                  {CTA_ALIGNMENTS.map(a => (
                    <button key={a.id} onClick={() => setForm(f => ({ ...f, cta_alignment: a.id }))}
                      className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all border flex items-center justify-center gap-2 ${form.cta_alignment === a.id ? "border-[hsl(220,80%,50%)] bg-[hsl(220,80%,97%)] text-[hsl(220,80%,50%)]" : "border-[hsl(220,20%,90%)] text-[hsl(220,20%,30%)] hover:bg-[hsl(220,20%,97%)]"}`}>
                      <span className="text-xs">{a.icon}</span> {a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                  className="w-5 h-5 rounded accent-[hsl(220,80%,50%)]" />
                <span className="text-sm font-medium text-[hsl(220,20%,25%)]">Active (visible to users)</span>
              </label>

              {/* Live Preview */}
              <div>
                <label className="text-sm font-semibold text-[hsl(220,20%,25%)] mb-2 block">👁️ Live Preview</label>
                <div className="bg-[hsl(220,20%,96%)] rounded-xl p-4 flex items-center justify-center">
                  <div
                    className="overflow-hidden"
                    style={{
                      width: form.custom_width || "100%",
                      maxWidth: "100%",
                      height: form.custom_height || "160px",
                      borderRadius: form.border_radius || "16px",
                      background: form.gradient,
                    }}
                  >
                    <div className="flex items-center h-full relative">
                      {form.image_url && <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                      {form.image_url && <div className="absolute inset-0" style={{ background: `${form.gradient.split(')')[0]}, 0.5)` }} />}
                      <div className={`relative z-10 flex items-center w-full h-full p-4 ${form.cta_alignment === "center" ? "justify-center text-center" : form.cta_alignment === "right" ? "justify-end text-right" : "justify-start text-left"}`}>
                        <div className={form.cta_alignment === "center" ? "" : "flex-1"}>
                          {form.title && <h3 className="text-white text-base font-bold leading-tight whitespace-pre-line">{form.title}</h3>}
                          {form.subtitle && <p className="text-white/80 text-xs mt-1 whitespace-pre-line">{form.subtitle}</p>}
                          {form.cta_text && <button className="mt-2 bg-white text-black text-xs font-semibold px-3 py-1 rounded-full">{form.cta_text}</button>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-[hsl(220,15%,60%)] mt-1 text-center">
                  Route: <code className="bg-[hsl(220,20%,93%)] px-1.5 py-0.5 rounded">{form.target_route}</code> • {form.custom_width} × {form.custom_height} • {form.placement}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(220,20%,88%)] text-sm font-medium text-[hsl(220,20%,30%)]">Cancel</button>
                <button onClick={handleSave}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[hsl(220,80%,50%)] hover:bg-[hsl(220,80%,45%)]">
                  {editingId ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Banner Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[hsl(220,80%,50%)]" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-12 text-center">
          <ImageIcon className="w-12 h-12 mx-auto text-[hsl(220,15%,75%)] mb-3" />
          <p className="text-[hsl(220,15%,55%)] text-sm">No advertisements yet. Click "Create Ad" to add one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(b => (
            <div key={b.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${b.is_active ? "border-[hsl(220,20%,92%)]" : "border-[hsl(0,0%,85%)] opacity-60"}`}>
              {/* Banner Preview */}
              <div className="relative h-28 overflow-hidden" style={{ background: b.gradient }}>
                <div className="flex items-center h-full relative">
                  {b.image_url && <img src={b.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />}
                  {b.image_url && <div className="absolute inset-0" style={{ background: `${b.gradient.split(')')[0]}, 0.5)` }} />}
                  <div className="relative z-10 p-4 flex-1">
                    <h3 className="text-white text-sm font-bold leading-tight whitespace-pre-line line-clamp-2">{b.title || "No title"}</h3>
                    <p className="text-white/80 text-[11px] mt-0.5 line-clamp-1">{b.subtitle}</p>
                    {b.cta_text && <span className="inline-block mt-1.5 bg-white text-black text-[9px] font-semibold px-2 py-0.5 rounded-full">{b.cta_text}</span>}
                  </div>
                </div>
                {/* Badges */}
                <div className="absolute top-2 left-2 flex gap-1">
                  <span className="px-2 py-0.5 bg-black/40 text-white text-[9px] font-semibold rounded-lg backdrop-blur-sm">
                    {LOCATIONS.find(l => l.id === b.location)?.label || b.location}
                  </span>
                  <span className="px-2 py-0.5 bg-black/40 text-white text-[9px] font-semibold rounded-lg backdrop-blur-sm">
                    {b.banner_style}
                  </span>
                </div>
              </div>

              {/* Info & Actions */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="flex items-center gap-1 text-[11px] text-[hsl(220,15%,45%)]">
                      <MonitorSmartphone className="w-3 h-3" />
                      <code className="bg-[hsl(220,20%,95%)] px-1 rounded text-[10px]">{b.target_route}</code>
                    </span>
                    <span className="text-[10px] text-[hsl(220,15%,55%)]">{b.custom_width}×{b.custom_height}</span>
                    <span className="text-[10px] text-[hsl(220,15%,55%)]">#{b.position}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${b.is_active ? "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]" : "bg-[hsl(0,0%,92%)] text-[hsl(0,0%,45%)]"}`}>
                    {b.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex items-center gap-1 justify-end">
                  <button onClick={() => toggleActive(b)} className="p-1.5 rounded-lg hover:bg-[hsl(220,20%,96%)]" title={b.is_active ? "Deactivate" : "Activate"}>
                    {b.is_active ? <EyeOff className="w-3.5 h-3.5 text-[hsl(220,15%,55%)]" /> : <Eye className="w-3.5 h-3.5 text-[hsl(220,15%,55%)]" />}
                  </button>
                  <button onClick={() => handleEdit(b)} className="p-1.5 rounded-lg hover:bg-[hsl(220,20%,96%)]">
                    <Pencil className="w-3.5 h-3.5 text-[hsl(220,80%,50%)]" />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 rounded-lg hover:bg-[hsl(0,80%,96%)]">
                    <Trash2 className="w-3.5 h-3.5 text-[hsl(0,70%,50%)]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBanners;
