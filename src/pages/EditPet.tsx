import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Heart, Loader2, Save, X, Upload } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Pet = Database["public"]["Tables"]["pets"]["Row"];

const EditPet = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    price: "",
    description: "",
    name: "",
    breed: "",
    color: "",
    vaccinated: false,
    microchip: "",
    medical_history: "",
  });

  useEffect(() => {
    fetchPet();
  }, [id]);

  const fetchPet = async () => {
    if (!id) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("id", id)
      .eq("owner_id", session.user.id)
      .single();

    if (error || !data) {
      toast.error("Pet not found or you don't have permission to edit");
      navigate("/seller-dashboard");
      return;
    }

    setPet(data);
    setExistingImages(data.images || []);
    setFormData({
      price: data.price.toString(),
      description: data.description || "",
      name: data.name,
      breed: data.breed,
      color: data.color || "",
      vaccinated: data.vaccinated || false,
      microchip: data.microchip || "",
      medical_history: data.medical_history || "",
    });
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > 20) {
      toast.error("Maximum 20 images allowed");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max 10MB`);
        return false;
      }
      return true;
    });

    setNewImages((prev) => [...prev, ...validFiles]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadNewImages = async (userId: string) => {
    const paths: string[] = [];

    for (const file of newImages) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/image_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("pet-media")
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("pet-media")
        .getPublicUrl(fileName);

      paths.push(urlData.publicUrl);
    }

    return paths;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pet) return;

    if (existingImages.length + newImages.length === 0) {
      toast.error("Please add at least one image");
      return;
    }

    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      let allImages = [...existingImages];
      
      if (newImages.length > 0) {
        const uploadedUrls = await uploadNewImages(session.user.id);
        allImages = [...allImages, ...uploadedUrls];
      }

      // Determine if re-verification is needed
      const priceChanged = parseFloat(formData.price) !== Number(pet.price);
      const needsReverification = priceChanged;

      const { error } = await supabase
        .from("pets")
        .update({
          name: formData.name,
          breed: formData.breed,
          price: parseFloat(formData.price),
          description: formData.description || null,
          color: formData.color || null,
          vaccinated: formData.vaccinated,
          microchip: formData.microchip || null,
          medical_history: formData.medical_history || null,
          images: allImages,
          // If significant changes, send for re-verification
          verification_status: needsReverification ? "pending" : pet.verification_status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", pet.id);

      if (error) throw error;

      if (needsReverification) {
        toast.success("Pet updated! It will be re-verified within 24-48 hours.");
      } else {
        toast.success("Pet updated successfully!");
      }
      
      navigate("/seller-dashboard");
    } catch (error: any) {
      console.error("Error updating pet:", error);
      toast.error(error.message || "Failed to update pet");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            onClick={() => navigate("/seller-dashboard")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-2xl flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Edit Pet
              </span>
              <p className="text-xs text-muted-foreground">{pet?.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Images Section */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>Update pet photos (max 20)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing Images */}
              {existingImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {existingImages.map((url, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={url}
                        alt={`Pet ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6"
                        onClick={() => removeExistingImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* New Images Preview */}
              {newImages.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {newImages.map((file, index) => (
                    <div key={index} className="relative aspect-square">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg border-2 border-primary"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 w-6 h-6"
                        onClick={() => removeNewImage(index)}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload Button */}
              <div className="border-2 border-dashed border-border rounded-2xl p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to add more images
                  </p>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Basic Info */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Pet Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Breed</Label>
                  <Input
                    value={formData.breed}
                    onChange={(e) =>
                      setFormData({ ...formData, breed: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <Input
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Describe your pet..."
                className="rounded-xl min-h-[100px]"
              />
            </CardContent>
          </Card>

          {/* Health Info */}
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle>Health Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Microchip Number (optional)</Label>
                <Input
                  value={formData.microchip}
                  onChange={(e) =>
                    setFormData({ ...formData, microchip: e.target.value })
                  }
                  placeholder="Enter microchip number"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Medical History (optional)</Label>
                <Textarea
                  value={formData.medical_history}
                  onChange={(e) =>
                    setFormData({ ...formData, medical_history: e.target.value })
                  }
                  placeholder="Any medical conditions or history..."
                  className="rounded-xl"
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full rounded-2xl bg-gradient-primary hover:opacity-90"
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Note: Significant changes (like price) may require re-verification.
          </p>
        </form>
      </main>
    </div>
  );
};

export default EditPet;
