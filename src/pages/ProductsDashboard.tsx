import { useEffect, useState } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRoleGuard } from "@/hooks/useRoleGuard";
import { PET_NAMES } from "@/lib/shopData";
import ProductFormFields, { INITIAL_PRODUCT_FORM, type ProductFormData } from "@/components/products/ProductFormFields";
import HeaderProfileDropdown from "@/components/HeaderProfileDropdown";
import {
  Plus, Package, Heart, Eye, Edit, Trash2, Loader2, ShoppingBag, LogOut, ImageIcon
} from "lucide-react";

const ProductsDashboard = () => {
  const navigate = useNavigate();
  const { isLoading: guardLoading, user, profile, error: guardError } = useRoleGuard(["product_seller"], "/auth-products");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPetType, setSelectedPetType] = useState("");
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_PRODUCT_FORM);
  const [productImages, setProductImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);

  useEffect(() => {
    if (user && profile) {
      if (!profile.is_onboarding_complete) { navigate("/products-onboarding"); return; }
      if (!profile.is_admin_approved) { navigate("/products-pending-approval"); return; }
      fetchProducts();
    }
  }, [user, profile]);

  const fetchProducts = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("shop_products")
      .select("*")
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Failed to load products");
    setProducts(data || []);
    setIsLoading(false);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalExisting = existingImageUrls.length;
    if (files.length + productImages.length + totalExisting > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }
    const newFiles = [...productImages, ...files];
    setProductImages(newFiles);
    setImagePreviewUrls(newFiles.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    const newFiles = productImages.filter((_, i) => i !== index);
    const newUrls = imagePreviewUrls.filter((_, i) => i !== index);
    setProductImages(newFiles);
    setImagePreviewUrls(newUrls);
  };

  const removeExistingImage = (index: number) => {
    setExistingImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async (files: File[], userId: string) => {
    const urls: string[] = [];
    for (const file of files) {
      const ext = file.name.split('.').pop();
      const path = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(path);
      urls.push(publicUrl);
    }
    return urls;
  };

  const handleAddProduct = async () => {
    if (!formData.name || !formData.brand || !formData.category || !formData.pet_type || !formData.price || !formData.stock) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (productImages.length > 0) {
        imageUrls = await uploadImages(productImages, user.id);
      }

      const { error } = await supabase.from("shop_products").insert({
        seller_id: user.id,
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        category: formData.category,
        pet_type: formData.pet_type,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : parseFloat(formData.price),
        discount: parseInt(formData.discount) || 0,
        stock: parseInt(formData.stock),
        weight: formData.weight,
        images: imageUrls,
      });

      if (error) throw error;
      toast.success("Product added! It will be visible after admin approval.");
      setIsAddModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to add product");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const { error } = await supabase.from("shop_products").delete().eq("id", id);
    if (error) toast.error("Failed to delete");
    else { toast.success("Product deleted"); setProducts(prev => prev.filter(p => p.id !== id)); }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || "",
      brand: product.brand,
      category: product.category,
      pet_type: product.pet_type,
      price: String(product.price),
      original_price: String(product.original_price || ""),
      discount: String(product.discount || 0),
      stock: String(product.stock),
      weight: product.weight || "",
      unit: "piece",
      sku: "",
      tags: "",
    });
    setSelectedPetType(product.pet_type);
    setExistingImageUrls(product.images || []);
    setProductImages([]);
    setImagePreviewUrls([]);
    setIsEditModalOpen(true);
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      let imageUrls = [...existingImageUrls];
      if (productImages.length > 0) {
        const newUrls = await uploadImages(productImages, user.id);
        imageUrls = [...imageUrls, ...newUrls];
      }

      const { error } = await supabase.from("shop_products").update({
        name: formData.name,
        description: formData.description,
        brand: formData.brand,
        category: formData.category,
        pet_type: formData.pet_type,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : parseFloat(formData.price),
        discount: parseInt(formData.discount) || 0,
        stock: parseInt(formData.stock),
        weight: formData.weight,
        images: imageUrls,
        verification_status: "pending",
      }).eq("id", editingProduct.id);

      if (error) throw error;
      toast.success("Product updated! Changes will be visible after re-verification.");
      setIsEditModalOpen(false);
      resetForm();
      fetchProducts();
    } catch (error: any) {
      toast.error(error.message || "Failed to update");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_PRODUCT_FORM);
    setProductImages([]);
    setImagePreviewUrls([]);
    setExistingImageUrls([]);
    setSelectedPetType("");
    setEditingProduct(null);
  };

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case "verified": return <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>;
      case "failed": return <Badge variant="destructive">Rejected</Badge>;
      default: return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const stats = {
    total: products.length,
    active: products.filter(p => p.verification_status === "verified" && p.is_active).length,
    pending: products.filter(p => p.verification_status === "pending").length,
    totalSold: products.reduce((sum, p) => sum + (p.total_sold || 0), 0),
  };

  const handleLogout = async () => { await supabase.auth.signOut(); navigate("/auth-products"); };

  if (guardError) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-0 shadow-card text-center">
        <CardContent className="p-8 space-y-4">
          <Package className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">{guardError}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => window.location.reload()} className="rounded-xl">Try Again</Button>
            <Button variant="outline" onClick={() => navigate("/auth-products")} className="rounded-xl">Go to Login</Button>
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

  if (isLoading && !products.length) return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <div className="text-center space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Loading your products...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
              <p className="text-xs text-muted-foreground">Product Seller Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HeaderProfileDropdown />
            <Button variant="ghost" size="icon" onClick={handleLogout}><LogOut className="w-5 h-5" /></Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Products", value: stats.total, icon: Package, color: "bg-blue-100 text-blue-600" },
            { label: "Active", value: stats.active, icon: Eye, color: "bg-emerald-100 text-emerald-600" },
            { label: "Pending", value: stats.pending, icon: Package, color: "bg-amber-100 text-amber-600" },
            { label: "Total Sold", value: stats.totalSold, icon: ShoppingBag, color: "bg-purple-100 text-purple-600" },
          ].map(s => (
            <Card key={s.label} className="border-0 shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add Product Button */}
        <div className="mb-8">
          <Button size="lg" className="w-full md:w-auto bg-gradient-primary hover:opacity-90 rounded-2xl shadow-float"
            onClick={() => navigate("/add-product")}>
            <Plus className="w-5 h-5 mr-2" />Add New Product
          </Button>
        </div>

        {/* Products List */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 rounded-2xl">
            <TabsTrigger value="all" className="rounded-xl">All Products</TabsTrigger>
            <TabsTrigger value="verified" className="rounded-xl">Active</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl">Pending</TabsTrigger>
          </TabsList>

          {["all", "verified", "pending"].map(tab => (
            <TabsContent key={tab} value={tab}>
              <Card className="border-0 shadow-card">
                <CardHeader>
                  <CardTitle>
                    {tab === "all" ? "All Products" : tab === "verified" ? "Active Products" : "Pending Verification"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const filtered = tab === "all" ? products : products.filter(p => p.verification_status === tab);
                    if (filtered.length === 0) return (
                      <div className="text-center py-12 text-muted-foreground">
                        No products found. Click "Add New Product" to get started.
                      </div>
                    );
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map(product => (
                          <div key={product.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-card transition-all">
                            <div className="aspect-video relative bg-muted">
                              {product.images?.[0] ? (
                                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-muted-foreground" /></div>
                              )}
                              <div className="absolute top-2 right-2">{getVerificationBadge(product.verification_status)}</div>
                              {product.discount > 0 && (
                                <Badge className="absolute top-2 left-2 bg-emerald-500 text-white">{product.discount}% OFF</Badge>
                              )}
                            </div>
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold line-clamp-1">{product.name}</h3>
                                  <p className="text-sm text-muted-foreground">{product.brand} • {PET_NAMES[product.pet_type] || product.pet_type}</p>
                                </div>
                                <p className="font-bold text-primary">₹{product.price}</p>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                                <span>Stock: {product.stock}</span>
                                <span>•</span>
                                <span>Sold: {product.total_sold || 0}</span>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="flex-1 rounded-xl" onClick={() => openEditModal(product)}>
                                  <Edit className="w-4 h-4 mr-1" />Edit
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-xl text-destructive hover:text-destructive"
                                  onClick={() => handleDeleteProduct(product.id)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>

      {/* Add Product Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={v => { if (!v) resetForm(); setIsAddModalOpen(v); }}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2"><Plus className="w-5 h-5" />Add New Product</DialogTitle>
            <DialogDescription>Fill in the product details. It will be visible after admin approval.</DialogDescription>
          </DialogHeader>
          <ProductFormFields
            formData={formData}
            onFormChange={setFormData}
            selectedPetType={selectedPetType}
            onPetTypeChange={setSelectedPetType}
            productImages={productImages}
            imagePreviewUrls={imagePreviewUrls}
            onImageSelect={handleImageSelect}
            onRemoveImage={removeImage}
          />
          <Button className="w-full rounded-2xl bg-gradient-primary hover:opacity-90 flex-shrink-0 mt-2" onClick={handleAddProduct} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Adding...</> : "Add Product"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Edit Product Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={v => { if (!v) resetForm(); setIsEditModalOpen(v); }}>
        <DialogContent className="sm:max-w-lg rounded-3xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2"><Edit className="w-5 h-5" />Edit Product</DialogTitle>
            <DialogDescription>Update product details. Changes require re-verification.</DialogDescription>
          </DialogHeader>
          <ProductFormFields
            formData={formData}
            onFormChange={setFormData}
            selectedPetType={selectedPetType}
            onPetTypeChange={setSelectedPetType}
            productImages={productImages}
            imagePreviewUrls={imagePreviewUrls}
            existingImageUrls={existingImageUrls}
            onImageSelect={handleImageSelect}
            onRemoveImage={removeImage}
            onRemoveExistingImage={removeExistingImage}
          />
          <Button className="w-full rounded-2xl bg-gradient-primary hover:opacity-90 flex-shrink-0 mt-2" onClick={handleEditProduct} disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsDashboard;
