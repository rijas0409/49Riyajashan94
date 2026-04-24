import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PET_CATEGORIES, PET_NAMES } from "@/lib/shopData";
import {
  ArrowLeft, ArrowRight, Heart, Loader2, Upload, X, Plus, Trash2,
  ImageIcon, FileText, IndianRupee, Package, Truck, Shield, Eye, Video, CheckCircle
} from "lucide-react";

const ALL_PET_TYPES = Object.keys(PET_NAMES);

const DOG_BREEDS = ["Golden Retriever", "Labrador", "Pomeranian", "German Shepherd", "Beagle", "Pug", "Rottweiler", "Shih Tzu", "Husky", "Doberman", "All Breeds"];
const CAT_BREEDS = ["Persian", "Siamese", "Maine Coon", "Ragdoll", "Bengal", "British Shorthair", "Sphynx", "All Breeds"];

const HIGHLIGHT_TYPES = ["Flavour", "Box Content", "Pack Size", "Suitability", "Nutrients", "Benefits", "Custom"];

const STEPS = [
  { id: 1, title: "Media", icon: ImageIcon, description: "Upload photos & videos" },
  { id: 2, title: "Basic Info", icon: FileText, description: "Product details" },
  { id: 3, title: "Pricing", icon: IndianRupee, description: "Set your price" },
  { id: 4, title: "Inventory", icon: Package, description: "Stock & variants" },
  { id: 5, title: "Shipping", icon: Truck, description: "Location & delivery" },
  { id: 6, title: "Documents", icon: FileText, description: "Certificates" },
  { id: 7, title: "Compliance", icon: Shield, description: "Regulations" },
  { id: 8, title: "Preview", icon: Eye, description: "Review & submit" },
];

interface VariantItem {
  label: string;
  packSize: string;
  price: string;
  originalPrice: string;
  discount: string;
}

interface HighlightItem { type: string; customType: string; value: string; }
interface FeedingRow { weight: string; serving: string; }

interface ProductMediaFile {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const AddProduct = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Step 1 - Media
  const [media, setMedia] = useState<ProductMediaFile[]>([]);

  // Step 2 - Basic Info
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [petType, setPetType] = useState("");
  const [category, setCategory] = useState("");
  const [breedApplicable, setBreedApplicable] = useState<string[]>([]);
  const [sku, setSku] = useState("");
  const [countryOfOrigin, setCountryOfOrigin] = useState("India");
  const [description, setDescription] = useState("");
  const [highlights, setHighlights] = useState<HighlightItem[]>([{ type: "Flavour", customType: "", value: "" }]);
  const [ingredients, setIngredients] = useState<string[]>([""]);
  const [feedingGuide, setFeedingGuide] = useState<FeedingRow[]>([]);

  // Step 3 - Pricing
  const [sellingPrice, setSellingPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [gstInclusive, setGstInclusive] = useState(true);
  const [taxPercentage, setTaxPercentage] = useState("");

  // Step 4 - Inventory
  const [stock, setStock] = useState("");
  const [weight, setWeight] = useState("");
  const [unit, setUnit] = useState("piece");
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [lowStockAlert, setLowStockAlert] = useState(false);

  // Step 5 - Shipping
  const [dispatchCity, setDispatchCity] = useState("");
  const [handlingTime, setHandlingTime] = useState("");
  const [shippingFree, setShippingFree] = useState(true);
  const [shippingCharges, setShippingCharges] = useState("");
  const [deliveryScope, setDeliveryScope] = useState("pan_india");

  // Step 6 - Documents
  const [gstCertFile, setGstCertFile] = useState<File | null>(null);
  const [tradeLicenseFile, setTradeLicenseFile] = useState<File | null>(null);
  const [fssaiFile, setFssaiFile] = useState<File | null>(null);
  const [brandAuthFile, setBrandAuthFile] = useState<File | null>(null);

  // Step 7 - Compliance
  const [expiryDate, setExpiryDate] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [storageInstructions, setStorageInstructions] = useState("");
  const [returnPolicy, setReturnPolicy] = useState("");
  const [warranty, setWarranty] = useState("");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth-products"); return; }
      setUser(session.user);
    };
    init();
  }, []);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const imageCount = media.filter(m => m.type === 'image').length;
    const videoCount = media.filter(m => m.type === 'video').length;
    const newMedia: ProductMediaFile[] = [];
    for (const file of files) {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      if (!isVideo && !isImage) { toast.error(`${file.name} is not valid`); continue; }
      if (isImage && imageCount + newMedia.filter(m => m.type === 'image').length >= 20) { toast.error("Max 20 images"); continue; }
      if (isVideo && videoCount + newMedia.filter(m => m.type === 'video').length >= 2) { toast.error("Max 2 videos"); continue; }
      const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) { toast.error(`${file.name} too large`); continue; }
      newMedia.push({ file, preview: URL.createObjectURL(file), type: isVideo ? 'video' : 'image' });
    }
    setMedia(prev => [...prev, ...newMedia]);
  };

  const removeMedia = (index: number) => {
    setMedia(prev => { URL.revokeObjectURL(prev[index].preview); return prev.filter((_, i) => i !== index); });
  };

  const imageCount = media.filter(m => m.type === 'image').length;
  const videoCount = media.filter(m => m.type === 'video').length;
  const discount = mrp && sellingPrice ? Math.round(((parseFloat(mrp) - parseFloat(sellingPrice)) / parseFloat(mrp)) * 100) : 0;
  const categories = petType ? (PET_CATEGORIES[petType] || []) : [];
  const breedOptions = petType === "dog" ? DOG_BREEDS : petType === "cat" ? CAT_BREEDS : [];

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1: if (imageCount === 0) { toast.error("Upload at least one image"); return false; } return true;
      case 2: {
        if (!name || !brand || !petType || !category) { toast.error("Fill all required fields (Name, Brand, Pet Type, Category)"); return false; }
        if (!sku) { toast.error("SKU is mandatory"); return false; }
        if (!countryOfOrigin) { toast.error("Country of Origin is mandatory"); return false; }
        if (!description.trim()) { toast.error("Description is mandatory"); return false; }
        const filledHighlights = highlights.filter(h => h.value.trim());
        if (filledHighlights.length === 0) { toast.error("Add at least one Product Highlight"); return false; }
        const filledIngredients = ingredients.filter(i => i.trim());
        if (filledIngredients.length === 0) { toast.error("Add at least one Ingredient"); return false; }
        if (feedingGuide.length === 0 || !feedingGuide.some(r => r.weight.trim() && r.serving.trim())) { toast.error("Add at least one Feeding Guide row"); return false; }
        return true;
      }
      case 3: if (!sellingPrice) { toast.error("Enter selling price"); return false; } return true;
      case 4: {
        if (!stock) { toast.error("Enter stock quantity"); return false; }
        if (!weight) { toast.error("Weight is mandatory"); return false; }
        if (!unit) { toast.error("Unit is mandatory"); return false; }
        if (variants.length === 0) { toast.error("Add at least one Pack/Variant"); return false; }
        const validVariants = variants.filter(v => v.label.trim());
        if (validVariants.length === 0) { toast.error("Fill at least one variant label"); return false; }
        return true;
      }
      case 5: {
        if (!dispatchCity) { toast.error("Dispatch City is mandatory"); return false; }
        if (!handlingTime) { toast.error("Handling Time is mandatory"); return false; }
        if (!deliveryScope) { toast.error("Delivery Availability is mandatory"); return false; }
        if (!shippingFree && !shippingCharges) { toast.error("Enter shipping charges"); return false; }
        return true;
      }
      case 6: {
        if (!gstCertFile) { toast.error("GST Certificate is mandatory"); return false; }
        if (!tradeLicenseFile) { toast.error("Trade License is mandatory"); return false; }
        if (!fssaiFile) { toast.error("FSSAI Certificate is mandatory"); return false; }
        if (!brandAuthFile) { toast.error("Brand Authorization is mandatory"); return false; }
        return true;
      }
      case 7: {
        if (!expiryDate) { toast.error("Expiry Date is mandatory"); return false; }
        if (!batchNumber) { toast.error("Batch Number is mandatory"); return false; }
        if (!storageInstructions.trim()) { toast.error("Storage Instructions is mandatory"); return false; }
        if (!returnPolicy.trim()) { toast.error("Return Policy is mandatory"); return false; }
        return true;
      }
      default: return true;
    }
  };

  const handleNext = () => { if (validateStep(currentStep)) setCurrentStep(prev => Math.min(prev + 1, STEPS.length)); };
  const handleBack = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const uploadFile = async (file: File, bucket: string, folder: string) => {
    const ext = file.name.split('.').pop();
    const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  // Build highlights as "Type: Value" strings
  const buildHighlightsArray = () => {
    return highlights
      .filter(h => h.value.trim())
      .map(h => {
        const label = h.type === "Custom" ? (h.customType.trim() || "Custom") : h.type;
        return `${label}: ${h.value.trim()}`;
      });
  };

  // Build variants for DB
  const buildVariantsArray = () => {
    return variants.filter(v => v.label.trim()).map(v => ({
      label: v.label,
      packSize: v.packSize,
      price: v.price ? parseFloat(v.price) : null,
      originalPrice: v.originalPrice ? parseFloat(v.originalPrice) : null,
      discount: v.discount || null,
    }));
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft && !validateStep(currentStep)) return;
    if (!user) return;
    setIsLoading(true);
    try {
      const imageFiles = media.filter(m => m.type === 'image').map(m => m.file);
      const videoFiles = media.filter(m => m.type === 'video').map(m => m.file);
      const imageUrls = await Promise.all(imageFiles.map(f => uploadFile(f, "product-images", user.id)));
      const videoUrls = await Promise.all(videoFiles.map(f => uploadFile(f, "product-images", user.id)));

      let gstCertUrl = null, tradeLicUrl = null, fssaiUrl = null, brandAuthUrl = null;
      if (gstCertFile) gstCertUrl = await uploadFile(gstCertFile, "product-images", `${user.id}/docs`);
      if (tradeLicenseFile) tradeLicUrl = await uploadFile(tradeLicenseFile, "product-images", `${user.id}/docs`);
      if (fssaiFile) fssaiUrl = await uploadFile(fssaiFile, "product-images", `${user.id}/docs`);
      if (brandAuthFile) brandAuthUrl = await uploadFile(brandAuthFile, "product-images", `${user.id}/docs`);

      const { error } = await supabase.from("shop_products").insert({
        seller_id: user.id,
        name, brand, pet_type: petType, category, sku: sku || null,
        country_of_origin: countryOfOrigin || null,
        description: description || null,
        highlights: buildHighlightsArray(),
        ingredients: ingredients.filter(i => i.trim()),
        feeding_guide: feedingGuide.filter(r => r.weight.trim() || r.serving.trim()),
        price: parseFloat(sellingPrice),
        original_price: mrp ? parseFloat(mrp) : parseFloat(sellingPrice),
        discount: discount > 0 ? discount : 0,
        gst_inclusive: gstInclusive,
        tax_percentage: taxPercentage ? parseFloat(taxPercentage) : 0,
        stock: parseInt(stock) || 0,
        weight: weight || null, unit,
        variants: buildVariantsArray(),
        low_stock_alert: lowStockAlert,
        dispatch_city: dispatchCity || null,
        handling_time: handlingTime || null,
        shipping_free: shippingFree,
        shipping_charges: shippingCharges ? parseFloat(shippingCharges) : 0,
        delivery_scope: deliveryScope,
        gst_certificate: gstCertUrl,
        trade_license: tradeLicUrl,
        fssai_certificate: fssaiUrl,
        brand_authorization: brandAuthUrl,
        expiry_date: expiryDate || null,
        batch_number: batchNumber || null,
        storage_instructions: storageInstructions || null,
        return_policy: returnPolicy || null,
        warranty: warranty || null,
        images: imageUrls,
        videos: videoUrls,
        breed_applicable: breedApplicable,
        tags: buildHighlightsArray(),
        is_draft: isDraft,
        verification_status: "pending",
      } as any);

      if (error) throw error;
      toast.success(isDraft ? "Draft saved!" : "Product submitted for approval!");
      navigate("/products-dashboard");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    } finally {
      setIsLoading(false);
    }
  };

  // Highlight handlers
  const addHighlight = () => setHighlights(prev => [...prev, { type: "Flavour", customType: "", value: "" }]);
  const updateHighlightType = (i: number, type: string) => setHighlights(prev => prev.map((h, idx) => idx === i ? { ...h, type, customType: type === "Custom" ? h.customType : "" } : h));
  const updateHighlightCustomType = (i: number, v: string) => setHighlights(prev => prev.map((h, idx) => idx === i ? { ...h, customType: v } : h));
  const updateHighlightValue = (i: number, v: string) => setHighlights(prev => prev.map((h, idx) => idx === i ? { ...h, value: v } : h));
  const removeHighlight = (i: number) => setHighlights(prev => prev.filter((_, idx) => idx !== i));

  // Ingredient handlers
  const addIngredient = () => setIngredients(prev => [...prev, ""]);
  const updateIngredient = (i: number, v: string) => setIngredients(prev => prev.map((ing, idx) => idx === i ? v : ing));
  const removeIngredient = (i: number) => setIngredients(prev => prev.filter((_, idx) => idx !== i));

  // Feeding Guide handlers
  const addFeedingRow = () => setFeedingGuide(prev => [...prev, { weight: "", serving: "" }]);
  const updateFeedingRow = (i: number, field: "weight" | "serving", v: string) =>
    setFeedingGuide(prev => prev.map((r, idx) => idx === i ? { ...r, [field]: v } : r));
  const removeFeedingRow = (i: number) => setFeedingGuide(prev => prev.filter((_, idx) => idx !== i));

  // Variant handlers (pack builder)
  const addVariant = () => setVariants(prev => [...prev, { label: "", packSize: "", price: "", originalPrice: "", discount: "" }]);
  const updateVariantField = (i: number, field: keyof VariantItem, v: string) =>
    setVariants(prev => prev.map((vr, idx) => {
      if (idx !== i) return vr;
      const updated = { ...vr, [field]: v };
      // Auto-calculate discount when price or MRP changes
      if (field === "price" || field === "originalPrice") {
        const sp = Number(field === "price" ? v : updated.price);
        const mrpVal = Number(field === "originalPrice" ? v : updated.originalPrice);
        if (mrpVal > 0 && sp > 0 && mrpVal > sp) {
          updated.discount = `${Math.round(((mrpVal - sp) / mrpVal) * 100)}% OFF`;
        } else {
          updated.discount = "";
        }
      }
      return updated;
    }));
  const removeVariant = (i: number) => setVariants(prev => prev.filter((_, idx) => idx !== i));

  const renderStep = () => {
    switch (currentStep) {
      case 1: return (
        <div className="space-y-6">
          <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
            {media.map((item, index) => (
              <div key={index} className="relative aspect-square rounded-2xl overflow-hidden group">
                {item.type === 'image' ? (
                  <img src={item.preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Video className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-1 left-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.type === 'video' ? 'bg-primary text-white' : 'bg-success text-white'}`}>
                    {item.type === 'video' ? 'Video' : 'Photo'}
                  </span>
                </div>
                {index === 0 && item.type === 'image' && (
                  <span className="absolute bottom-0 inset-x-0 bg-primary/80 text-white text-[9px] text-center py-0.5">Cover</span>
                )}
                <button type="button" onClick={() => removeMedia(index)} className="absolute top-1 right-1 w-6 h-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <label className="aspect-square border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors">
              <input type="file" accept="image/*,video/*" multiple onChange={handleMediaUpload} className="hidden" />
              <Upload className="w-6 h-6 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Add</span>
            </label>
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>{imageCount}/20 photos</span>
            <span>{videoCount}/2 videos</span>
          </div>
        </div>
      );

      case 2: return (
        <div className="space-y-4">
          <div><Label className="text-sm font-semibold">Product Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Premium Chicken Dog Food" className="rounded-2xl mt-1.5" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-sm font-semibold">Brand *</Label>
              <Input value={brand} onChange={e => setBrand(e.target.value)} placeholder="Royal Canin" className="rounded-2xl mt-1.5" />
            </div>
            <div><Label className="text-sm font-semibold">Pet Type *</Label>
              <Select value={petType} onValueChange={v => { setPetType(v); setCategory(""); setBreedApplicable([]); }}>
                <SelectTrigger className="rounded-2xl mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{ALL_PET_TYPES.map(pt => <SelectItem key={pt} value={pt}>{PET_NAMES[pt]}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="text-sm font-semibold">Category *</Label>
              <Select value={category} onValueChange={setCategory} disabled={!petType}>
                <SelectTrigger className="rounded-2xl mt-1.5"><SelectValue placeholder={petType ? "Select" : "Pick pet first"} /></SelectTrigger>
                <SelectContent>{categories.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-sm font-semibold">SKU *</Label>
              <Input value={sku} onChange={e => setSku(e.target.value)} placeholder="RC-DOG-001" className="rounded-2xl mt-1.5" />
            </div>
          </div>
          {breedOptions.length > 0 && (
            <div><Label className="text-sm font-semibold">Applicable Breeds</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {breedOptions.map(b => (
                  <button key={b} onClick={() => setBreedApplicable(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b])}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${breedApplicable.includes(b) ? "bg-primary text-primary-foreground border-primary" : "bg-muted border-border text-foreground"}`}>
                    {b}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div><Label className="text-sm font-semibold">Country of Origin *</Label>
            <Input value={countryOfOrigin} onChange={e => setCountryOfOrigin(e.target.value)} className="rounded-2xl mt-1.5" />
          </div>
          <div><Label className="text-sm font-semibold">Description *</Label>
            <div className="relative mt-1.5">
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your product..." className="rounded-2xl min-h-[100px]" maxLength={2000} />
              <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground">{description.length}/2000</span>
            </div>
          </div>

          {/* ── C) Highlight with Dropdown ── */}
          <div>
            <Label className="text-sm font-semibold">Product Highlights *</Label>
            <p className="text-xs text-muted-foreground mb-2">Select highlight type then enter value</p>
            <div className="space-y-3 mt-1.5">
              {highlights.map((h, i) => (
                <div key={i} className="space-y-1.5 p-3 rounded-2xl bg-muted/30 border border-border">
                  <div className="flex gap-2 items-center">
                    <Select value={h.type} onValueChange={v => updateHighlightType(i, v)}>
                      <SelectTrigger className="rounded-xl w-36 h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {HIGHLIGHT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    {h.type === "Custom" && (
                      <Input value={h.customType} onChange={e => updateHighlightCustomType(i, e.target.value)}
                        placeholder="Custom label" className="rounded-xl h-9 text-xs flex-1" />
                    )}
                    {highlights.length > 1 && (
                      <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => removeHighlight(i)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  <Input value={h.value} onChange={e => updateHighlightValue(i, e.target.value)}
                    placeholder={`Enter ${h.type === "Custom" ? (h.customType || "custom") : h.type.toLowerCase()} value`}
                    className="rounded-xl h-9 text-sm" />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addHighlight} className="rounded-2xl">
                <Plus className="w-4 h-4 mr-1" /> Add Highlight
              </Button>
            </div>
          </div>

          {/* ── D) Ingredients in Basic Info ── */}
          <div>
            <Label className="text-sm font-semibold">Ingredients *</Label>
            <p className="text-xs text-muted-foreground mb-2">List all ingredients of your product</p>
            <div className="space-y-2 mt-1.5">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={ing} onChange={e => updateIngredient(i, e.target.value)} placeholder={`Ingredient ${i + 1}`} className="rounded-2xl" />
                  {ingredients.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeIngredient(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addIngredient} className="rounded-2xl"><Plus className="w-4 h-4 mr-1" /> Add</Button>
            </div>
          </div>

          {/* ── D) Feeding Guide in Basic Info ── */}
          <div>
            <Label className="text-sm font-semibold">How to Make (Feeding Guide) *</Label>
            <p className="text-xs text-muted-foreground mb-2">Add weight range and daily serving details</p>
            <div className="space-y-2 mt-1.5">
              {feedingGuide.length > 0 && (
                <div className="flex gap-2 text-xs font-semibold text-muted-foreground px-1">
                  <span className="flex-1">Weight Range</span>
                  <span className="flex-1">Daily Serving</span>
                  <span className="w-9" />
                </div>
              )}
              {feedingGuide.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <Input value={row.weight} onChange={e => updateFeedingRow(i, "weight", e.target.value)} placeholder="e.g. 2-5 kg" className="rounded-2xl flex-1" />
                  <Input value={row.serving} onChange={e => updateFeedingRow(i, "serving", e.target.value)} placeholder="e.g. 50-80g" className="rounded-2xl flex-1" />
                  <Button variant="ghost" size="icon" onClick={() => removeFeedingRow(i)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFeedingRow} className="rounded-2xl"><Plus className="w-4 h-4 mr-1" /> Add Row</Button>
            </div>
          </div>
        </div>
      );

      case 3: return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-sm font-semibold">Selling Price (₹) *</Label>
              <div className="relative mt-1.5"><IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="number" value={sellingPrice} onChange={e => setSellingPrice(e.target.value)} placeholder="499" className="rounded-2xl pl-9" min="0" />
              </div>
            </div>
            <div><Label className="text-sm font-semibold">MRP (₹)</Label>
              <div className="relative mt-1.5"><IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input type="number" value={mrp} onChange={e => setMrp(e.target.value)} placeholder="699" className="rounded-2xl pl-9" min="0" />
              </div>
            </div>
          </div>
          {discount > 0 && <Badge className="bg-emerald-100 text-emerald-700">Auto-calculated Discount: {discount}% OFF</Badge>}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
            <div><Label className="text-sm font-semibold">GST Inclusive</Label><p className="text-xs text-muted-foreground">Price includes GST</p></div>
            <Switch checked={gstInclusive} onCheckedChange={setGstInclusive} />
          </div>
          {!gstInclusive && (
            <div><Label className="text-sm font-semibold">Tax Percentage (%)</Label>
              <Input type="number" value={taxPercentage} onChange={e => setTaxPercentage(e.target.value)} placeholder="18" className="rounded-2xl mt-1.5" min="0" max="100" />
            </div>
          )}
        </div>
      );

      case 4: return (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div><Label className="text-xs font-semibold">Stock Qty *</Label>
              <Input type="number" value={stock} onChange={e => setStock(e.target.value)} placeholder="100" className="rounded-2xl mt-1.5" min="0" />
            </div>
            <div><Label className="text-xs font-semibold">Weight/Size *</Label>
              <Input value={weight} onChange={e => setWeight(e.target.value)} placeholder="1kg" className="rounded-2xl mt-1.5" />
            </div>
            <div><Label className="text-xs font-semibold">Unit *</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="rounded-2xl mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>{["piece","kg","gm","litre","ml","pack","box","bag"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* ── B) Pack/Variant Builder ── */}
          <div>
            <Label className="text-sm font-semibold">Packs / Variants *</Label>
            <p className="text-xs text-muted-foreground mb-2">Create pack options (e.g. "3 kg", "3 × 3 kg") with pricing</p>
            <div className="space-y-3 mt-2">
              {variants.map((v, i) => (
                <div key={i} className="p-3 rounded-2xl bg-muted/30 border border-border space-y-2">
                  <div className="flex gap-2">
                    <Input value={v.label} onChange={e => updateVariantField(i, "label", e.target.value)}
                      placeholder="Label (e.g. 3 kg)" className="rounded-xl flex-1" />
                    <Input value={v.packSize} onChange={e => updateVariantField(i, "packSize", e.target.value)}
                      placeholder="Pack (e.g. 3 × 3 kg)" className="rounded-xl flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeVariant(i)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="relative">
                      <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input type="number" value={v.price} onChange={e => updateVariantField(i, "price", e.target.value)}
                        placeholder="Price" className="rounded-xl pl-7 text-sm" />
                    </div>
                    <div className="relative">
                      <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                      <Input type="number" value={v.originalPrice} onChange={e => updateVariantField(i, "originalPrice", e.target.value)}
                        placeholder="MRP" className="rounded-xl pl-7 text-sm" />
                    </div>
                    <Input value={v.discount} readOnly
                      placeholder="Auto" className="rounded-xl text-sm bg-muted/50" />
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addVariant} className="rounded-2xl">
                <Plus className="w-4 h-4 mr-1" /> Add Pack / Variant
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
            <div><Label className="text-sm font-semibold">Low Stock Alert</Label><p className="text-xs text-muted-foreground">Get notified when stock is low</p></div>
            <Switch checked={lowStockAlert} onCheckedChange={setLowStockAlert} />
          </div>
        </div>
      );

      case 5: return (
        <div className="space-y-5">
          <div><Label className="text-sm font-semibold">Dispatch City *</Label>
            <Input value={dispatchCity} onChange={e => setDispatchCity(e.target.value)} placeholder="Mumbai" className="rounded-2xl mt-1.5" />
          </div>
          <div><Label className="text-sm font-semibold">Handling Time *</Label>
            <Select value={handlingTime} onValueChange={setHandlingTime}>
              <SelectTrigger className="rounded-2xl mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>{["Same Day","1-2 Days","3-5 Days","5-7 Days"].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/50">
            <div><Label className="text-sm font-semibold">Free Shipping</Label></div>
            <Switch checked={shippingFree} onCheckedChange={setShippingFree} />
          </div>
          {!shippingFree && (
            <div><Label className="text-sm font-semibold">Shipping Charges (₹)</Label>
              <Input type="number" value={shippingCharges} onChange={e => setShippingCharges(e.target.value)} placeholder="49" className="rounded-2xl mt-1.5" />
            </div>
          )}
          <div><Label className="text-sm font-semibold">Delivery Availability *</Label>
            <Select value={deliveryScope} onValueChange={setDeliveryScope}>
              <SelectTrigger className="rounded-2xl mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pan_india">PAN India</SelectItem>
                <SelectItem value="local">Local Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

      case 6: return (
        <div className="space-y-5">
          {[
            { label: "GST Certificate *", file: gstCertFile, setter: setGstCertFile },
            { label: "Shop / Trade License *", file: tradeLicenseFile, setter: setTradeLicenseFile },
            { label: "FSSAI Certificate *", file: fssaiFile, setter: setFssaiFile },
            { label: "Brand Authorization *", file: brandAuthFile, setter: setBrandAuthFile },
          ].map(doc => (
            <div key={doc.label} className="space-y-1.5">
              <Label className="text-sm font-semibold">{doc.label}</Label>
              {doc.file ? (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/50 border border-border">
                  <FileText className="w-4 h-4 text-primary" />
                  <span className="text-sm flex-1 truncate">{doc.file.name}</span>
                  <button onClick={() => doc.setter(null)}><X className="w-4 h-4 text-destructive" /></button>
                </div>
              ) : (
                <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-border cursor-pointer hover:border-primary/50 transition-colors">
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => { if (e.target.files?.[0]) doc.setter(e.target.files[0]); }} className="hidden" />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload</span>
                </label>
              )}
            </div>
          ))}
        </div>
      );

      case 7: return (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div><Label className="text-sm font-semibold">Expiry Date *</Label>
              <Input type="date" value={expiryDate} onChange={e => setExpiryDate(e.target.value)} className="rounded-2xl mt-1.5" />
            </div>
            <div><Label className="text-sm font-semibold">Batch Number *</Label>
              <Input value={batchNumber} onChange={e => setBatchNumber(e.target.value)} placeholder="BATCH-001" className="rounded-2xl mt-1.5" />
            </div>
          </div>
          <div><Label className="text-sm font-semibold">Storage Instructions *</Label>
            <Textarea value={storageInstructions} onChange={e => setStorageInstructions(e.target.value)} placeholder="Store in a cool, dry place..." className="rounded-2xl mt-1.5" rows={3} />
          </div>
          <div><Label className="text-sm font-semibold">Return Policy *</Label>
            <Textarea value={returnPolicy} onChange={e => setReturnPolicy(e.target.value)} placeholder="7-day return policy..." className="rounded-2xl mt-1.5" rows={3} />
          </div>
          <div><Label className="text-sm font-semibold">Warranty (optional)</Label>
            <Input value={warranty} onChange={e => setWarranty(e.target.value)} placeholder="6 months manufacturer warranty" className="rounded-2xl mt-1.5" />
          </div>
        </div>
      );

      case 8: return (
        <div className="space-y-6">
          {/* Preview Card */}
          <Card className="border-0 shadow-card rounded-3xl overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {media.filter(m => m.type === 'image')[0] ? (
                <img src={media.filter(m => m.type === 'image')[0].preview} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-12 h-12 text-muted-foreground" /></div>
              )}
              {discount > 0 && <Badge className="absolute top-3 left-3 bg-emerald-500 text-white">{discount}% OFF</Badge>}
            </div>
            <CardContent className="p-5">
              <h3 className="text-lg font-bold">{name || "Product Name"}</h3>
              <p className="text-sm text-muted-foreground">{brand} • {PET_NAMES[petType] || "Pet Type"}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xl font-bold text-primary">₹{sellingPrice || "0"}</span>
                {mrp && <span className="text-sm text-muted-foreground line-through">₹{mrp}</span>}
              </div>
            </CardContent>
          </Card>

          {/* Preview Details */}
          <div className="space-y-3 bg-muted/50 rounded-2xl p-4">
            <h3 className="font-semibold text-lg">{name || "Product Name"}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-muted-foreground">Brand:</span><span className="ml-2 font-medium">{brand}</span></div>
              <div><span className="text-muted-foreground">Pet Type:</span><span className="ml-2 font-medium">{PET_NAMES[petType] || "-"}</span></div>
              <div><span className="text-muted-foreground">Category:</span><span className="ml-2 font-medium">{category}</span></div>
              <div><span className="text-muted-foreground">Stock:</span><span className="ml-2 font-medium">{stock}</span></div>
              <div><span className="text-muted-foreground">Weight:</span><span className="ml-2 font-medium">{weight || "-"} {unit}</span></div>
              <div><span className="text-muted-foreground">Shipping:</span><span className="ml-2 font-medium">{shippingFree ? "Free" : `₹${shippingCharges}`}</span></div>
              <div><span className="text-muted-foreground">Media:</span><span className="ml-2 font-medium">{imageCount} photos, {videoCount} videos</span></div>
            </div>
            {variants.length > 0 && (
              <div>
                <span className="text-muted-foreground text-sm font-medium">Packs/Variants:</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {variants.filter(v => v.label.trim()).map((v, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {v.label} {v.packSize && `(${v.packSize})`} {v.price && `₹${v.price}`}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section edit buttons */}
          <div className="grid grid-cols-2 gap-2">
            {STEPS.slice(0, 7).map(s => (
              <Button key={s.id} variant="outline" size="sm" className="rounded-2xl text-xs" onClick={() => setCurrentStep(s.id)}>
                Edit {s.title}
              </Button>
            ))}
          </div>

          {/* Submit Buttons */}
          <div className="space-y-3">
            <Button className="w-full rounded-2xl h-14 text-base font-bold bg-gradient-primary hover:opacity-90"
              onClick={() => handleSubmit(false)} disabled={isLoading}>
              {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</> : <><CheckCircle className="w-5 h-5 mr-2" /> Submit for Approval</>}
            </Button>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => handleSubmit(true)} disabled={isLoading}>
              Save as Draft
            </Button>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/products-dashboard")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Add New Product</span>
              <p className="text-xs text-muted-foreground">Step {currentStep} of {STEPS.length}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-8 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max px-2">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => currentStep > step.id && setCurrentStep(step.id)}
                  disabled={currentStep < step.id}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                    currentStep === step.id ? "bg-primary/10 text-primary"
                      : currentStep > step.id ? "text-success cursor-pointer hover:bg-success/10"
                        : "text-muted-foreground"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    currentStep === step.id ? "bg-gradient-primary text-white"
                      : currentStep > step.id ? "bg-success text-white"
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {currentStep > step.id ? <CheckCircle className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                  </div>
                  <span className="text-[10px] font-medium whitespace-nowrap">{step.title}</span>
                </button>
                {index < STEPS.length - 1 && (
                  <div className={`w-6 h-0.5 mx-1 rounded-full ${currentStep > step.id ? "bg-success" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Card className="border-0 shadow-card rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">{STEPS[currentStep - 1].title}</CardTitle>
            <CardDescription>{STEPS[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {renderStep()}
            {currentStep < 8 && (
              <div className="flex gap-3 mt-8">
                {currentStep > 1 && (
                  <Button variant="outline" className="flex-1 rounded-2xl h-12" onClick={handleBack}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </Button>
                )}
                <Button className="flex-1 rounded-2xl h-12 bg-gradient-primary hover:opacity-90" onClick={handleNext}>
                  Next <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AddProduct;
