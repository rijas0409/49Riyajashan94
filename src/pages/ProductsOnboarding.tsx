import { useState } from "react";
import sruvoLogo from "@/assets/sruvo-logo.png";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Heart, Loader2, Upload, FileText, Camera, CheckCircle, Shield, Package } from "lucide-react";

const ProductsOnboarding = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    businessName: "",
    gstNumber: "",
    aadhaarFrontFile: null as File | null,
    aadhaarBackFile: null as File | null,
    termsAccepted: false,
  });
  const [aadhaarFrontPreview, setAadhaarFrontPreview] = useState<string | null>(null);
  const [aadhaarBackPreview, setAadhaarBackPreview] = useState<string | null>(null);

  const handleFileChange = (field: "aadhaarFrontFile" | "aadhaarBackFile") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      setFormData({ ...formData, [field]: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (field === "aadhaarFrontFile") setAadhaarFrontPreview(base64);
        else setAadhaarBackPreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, userId: string, type: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${type}_${Date.now()}.${fileExt}`;
    const { error } = await supabase.storage.from('seller-documents').upload(fileName, file);
    if (error) throw error;
    return fileName;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.termsAccepted) { toast.error("Please accept the terms and conditions"); return; }
    if (!formData.aadhaarFrontFile || !formData.aadhaarBackFile) { toast.error("Please upload Aadhaar front and back"); return; }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth-products"); return; }

      const userId = session.user.id;
      const aadhaarFrontUrl = await uploadFile(formData.aadhaarFrontFile, userId, 'aadhaar_front');
      const aadhaarBackUrl = await uploadFile(formData.aadhaarBackFile, userId, 'aadhaar_back');

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          name: formData.businessName || formData.fullName,
          aadhaar_file: `${aadhaarFrontUrl}|${aadhaarBackUrl}`,
          gst_number: formData.gstNumber,
          is_onboarding_complete: true,
          is_admin_approved: false,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Verification submitted! Your account will be reviewed within 24 hours.");
      navigate("/products-pending-approval");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit verification");
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { number: 1, title: "Business Info", icon: FileText },
    { number: 2, title: "Documents", icon: Shield },
    { number: 3, title: "Confirmation", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-1">
            <img src={sruvoLogo} alt="Sruvo" className="w-12 h-12 object-contain" />
            <div>
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">Sruvo</span>
              <p className="text-xs text-muted-foreground">Product Seller Verification</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex flex-col items-center ${currentStep >= step.number ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                  currentStep >= step.number ? "bg-gradient-primary text-white shadow-float" : "bg-muted"
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-1 mx-2 mb-6 rounded-full transition-all ${currentStep > step.number ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="border-0 shadow-card animate-fade-in">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Complete Your Product Seller Profile</CardTitle>
            <CardDescription>
              {currentStep === 1 && "Let's start with your business information"}
              {currentStep === 2 && "Upload your identity & business documents"}
              {currentStep === 3 && "Review and confirm your details"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input id="fullName" placeholder="Enter your full name" value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input id="phone" type="tel" placeholder="+91 9876543210" value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Business Address *</Label>
                    <Input id="address" placeholder="123, Pet Street, Mumbai, Maharashtra 400001" value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })} required className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business/Shop Name *</Label>
                    <Input id="businessName" placeholder="Happy Paws Pet Store" value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} required className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gstNumber">GST Number *</Label>
                    <Input id="gstNumber" placeholder="22AAAAA0000A1Z5" value={formData.gstNumber}
                      onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })} required className="rounded-2xl" />
                    <p className="text-xs text-muted-foreground">Required for product sellers in India</p>
                  </div>
                  <Button type="button" className="w-full rounded-2xl bg-gradient-primary hover:opacity-90"
                    onClick={() => setCurrentStep(2)}
                    disabled={!formData.fullName || !formData.phone || !formData.address || !formData.businessName || !formData.gstNumber}>
                    Continue
                  </Button>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      Aadhaar Card *
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      <p className="text-sm text-muted-foreground text-center font-medium">Front Side</p>
                      <p className="text-sm text-muted-foreground text-center font-medium">Back Side</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center hover:border-primary/50 transition-colors">
                        <input type="file" accept="image/*" onChange={handleFileChange("aadhaarFrontFile")} className="hidden" id="aadhaar-front" />
                        <label htmlFor="aadhaar-front" className="cursor-pointer">
                          {aadhaarFrontPreview ? (
                            <div className="space-y-2">
                              <img src={aadhaarFrontPreview} alt="Front" className="w-full h-20 object-cover rounded-lg" />
                              <div className="flex items-center justify-center gap-1 text-emerald-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">Uploaded</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Upload Front</p>
                            </>
                          )}
                        </label>
                      </div>
                      <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center hover:border-primary/50 transition-colors">
                        <input type="file" accept="image/*" onChange={handleFileChange("aadhaarBackFile")} className="hidden" id="aadhaar-back" />
                        <label htmlFor="aadhaar-back" className="cursor-pointer">
                          {aadhaarBackPreview ? (
                            <div className="space-y-2">
                              <img src={aadhaarBackPreview} alt="Back" className="w-full h-20 object-cover rounded-lg" />
                              <div className="flex items-center justify-center gap-1 text-emerald-600">
                                <CheckCircle className="w-4 h-4" />
                                <span className="text-xs">Uploaded</span>
                              </div>
                            </div>
                          ) : (
                            <>
                              <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">Upload Back</p>
                            </>
                          )}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(1)}>Back</Button>
                    <Button type="button" className="flex-1 rounded-2xl bg-gradient-primary hover:opacity-90"
                      onClick={() => setCurrentStep(3)}
                      disabled={!formData.aadhaarFrontFile || !formData.aadhaarBackFile}>
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-muted/50 rounded-2xl p-4 space-y-3">
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Name</span><span className="text-sm font-medium">{formData.fullName}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Phone</span><span className="text-sm font-medium">{formData.phone}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Business</span><span className="text-sm font-medium">{formData.businessName}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">GST</span><span className="text-sm font-medium">{formData.gstNumber}</span></div>
                    <div className="flex justify-between"><span className="text-sm text-muted-foreground">Aadhaar</span>
                      <span className="text-sm font-medium text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Uploaded</span>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-2xl">
                    <Checkbox id="terms" checked={formData.termsAccepted}
                      onCheckedChange={(checked) => setFormData({ ...formData, termsAccepted: checked as boolean })} />
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      I agree to the Terms of Service and confirm that all information provided is accurate.
                    </Label>
                  </div>

                  <div className="flex gap-3">
                    <Button type="button" variant="outline" className="flex-1 rounded-2xl" onClick={() => setCurrentStep(2)}>Back</Button>
                    <Button type="submit" className="flex-1 rounded-2xl bg-gradient-primary hover:opacity-90" disabled={isLoading || !formData.termsAccepted}>
                      {isLoading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Submitting...</>) : "Submit for Verification"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ProductsOnboarding;
