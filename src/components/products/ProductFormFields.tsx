import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, ImageIcon } from "lucide-react";
import { PET_CATEGORIES, PET_NAMES } from "@/lib/shopData";

const ALL_PET_TYPES = Object.keys(PET_NAMES);

export interface ProductFormData {
  name: string;
  description: string;
  brand: string;
  category: string;
  pet_type: string;
  price: string;
  original_price: string;
  discount: string;
  stock: string;
  weight: string;
  unit: string;
  sku: string;
  tags: string;
}

export const INITIAL_PRODUCT_FORM: ProductFormData = {
  name: "",
  description: "",
  brand: "",
  category: "",
  pet_type: "",
  price: "",
  original_price: "",
  discount: "0",
  stock: "",
  weight: "",
  unit: "piece",
  sku: "",
  tags: "",
};

interface ProductFormFieldsProps {
  formData: ProductFormData;
  onFormChange: (data: ProductFormData) => void;
  selectedPetType: string;
  onPetTypeChange: (type: string) => void;
  productImages: File[];
  imagePreviewUrls: string[];
  existingImageUrls?: string[];
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveExistingImage?: (index: number) => void;
}

const ProductFormFields = ({
  formData,
  onFormChange,
  selectedPetType,
  onPetTypeChange,
  productImages,
  imagePreviewUrls,
  existingImageUrls = [],
  onImageSelect,
  onRemoveImage,
  onRemoveExistingImage,
}: ProductFormFieldsProps) => {
  const categories = selectedPetType ? (PET_CATEGORIES[selectedPetType] || []) : [];
  const totalImages = imagePreviewUrls.length + existingImageUrls.length;

  const updateField = (field: keyof ProductFormData, value: string) => {
    onFormChange({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 pb-2">

      {/* ── 1. Product Images (top) ── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold flex items-center gap-1.5">
          <ImageIcon className="w-4 h-4 text-primary" /> Product Images
          <span className="text-xs text-muted-foreground font-normal ml-1">(max 5, first = cover)</span>
        </Label>
        <div className="flex gap-2 flex-wrap">
          {existingImageUrls.map((url, i) => (
            <div key={`existing-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              {onRemoveExistingImage && (
                <button type="button" onClick={() => onRemoveExistingImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                  <X className="w-3 h-3 text-white" />
                </button>
              )}
              {i === 0 && <span className="absolute bottom-0 inset-x-0 bg-primary/80 text-white text-[9px] text-center py-0.5">Cover</span>}
            </div>
          ))}
          {imagePreviewUrls.map((url, i) => (
            <div key={`new-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-border">
              <img src={url} alt="" className="w-full h-full object-cover" />
              <button type="button" onClick={() => onRemoveImage(i)} className="absolute top-0.5 right-0.5 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                <X className="w-3 h-3 text-white" />
              </button>
              {existingImageUrls.length === 0 && i === 0 && <span className="absolute bottom-0 inset-x-0 bg-primary/80 text-white text-[9px] text-center py-0.5">Cover</span>}
            </div>
          ))}
          {totalImages < 5 && (
            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors gap-1">
              <input type="file" accept="image/*" multiple onChange={onImageSelect} className="hidden" />
              <Upload className="w-5 h-5 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">Upload</span>
            </label>
          )}
        </div>
      </div>

      {/* ── 2. Product Name ── */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Product Name *</Label>
        <Input
          value={formData.name}
          onChange={e => updateField("name", e.target.value)}
          placeholder="e.g. Premium Chicken Dog Food"
          className="rounded-xl"
        />
      </div>

      {/* ── 3. Description ── */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Description</Label>
        <Textarea
          value={formData.description}
          onChange={e => updateField("description", e.target.value)}
          placeholder="Describe your product, ingredients, benefits..."
          className="rounded-xl min-h-[80px]"
          rows={3}
        />
      </div>

      {/* ── 4. Brand + Pet Type ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Brand *</Label>
          <Input
            value={formData.brand}
            onChange={e => updateField("brand", e.target.value)}
            placeholder="Royal Canin"
            className="rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Pet Type *</Label>
          <Select
            value={formData.pet_type}
            onValueChange={v => {
              updateField("pet_type", v);
              updateField("category", "");
              onPetTypeChange(v);
            }}
          >
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select pet" /></SelectTrigger>
            <SelectContent>
              {ALL_PET_TYPES.map(pt => (
                <SelectItem key={pt} value={pt}>{PET_NAMES[pt]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── 5. Category + SKU ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Category *</Label>
          <Select
            value={formData.category}
            onValueChange={v => updateField("category", v)}
            disabled={!selectedPetType}
          >
            <SelectTrigger className="rounded-xl"><SelectValue placeholder={selectedPetType ? "Select" : "Pick pet first"} /></SelectTrigger>
            <SelectContent>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">SKU / Product Code</Label>
          <Input
            value={formData.sku}
            onChange={e => updateField("sku", e.target.value)}
            placeholder="e.g. RC-DOG-001"
            className="rounded-xl"
          />
        </div>
      </div>

      {/* ── 6. Pricing ── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-primary">💰 Pricing</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Selling Price (₹) *</Label>
            <Input
              type="number"
              value={formData.price}
              onChange={e => updateField("price", e.target.value)}
              placeholder="499"
              className="rounded-xl"
              min="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">MRP (₹)</Label>
            <Input
              type="number"
              value={formData.original_price}
              onChange={e => updateField("original_price", e.target.value)}
              placeholder="699"
              className="rounded-xl"
              min="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Discount %</Label>
            <Input
              type="number"
              value={formData.discount}
              onChange={e => updateField("discount", e.target.value)}
              placeholder="20"
              className="rounded-xl"
              min="0"
              max="100"
            />
          </div>
        </div>
      </div>

      {/* ── 7. Inventory ── */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold text-primary">📦 Inventory</Label>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Stock Quantity *</Label>
            <Input
              type="number"
              value={formData.stock}
              onChange={e => updateField("stock", e.target.value)}
              placeholder="100"
              className="rounded-xl"
              min="0"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Weight / Size</Label>
            <Input
              value={formData.weight}
              onChange={e => updateField("weight", e.target.value)}
              placeholder="1kg / 500ml"
              className="rounded-xl"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Unit</Label>
            <Select value={formData.unit} onValueChange={v => updateField("unit", v)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {["piece", "kg", "gm", "litre", "ml", "pack", "box", "bag"].map(u => (
                  <SelectItem key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── 8. Tags ── */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">Tags / Keywords</Label>
        <Input
          value={formData.tags}
          onChange={e => updateField("tags", e.target.value)}
          placeholder="organic, grain-free, puppy (comma separated)"
          className="rounded-xl"
        />
        <p className="text-[10px] text-muted-foreground">Helps buyers find your product faster</p>
      </div>
    </div>
  );
};

export default ProductFormFields;
