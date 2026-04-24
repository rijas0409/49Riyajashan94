import { ArrowLeft, Share2, Download, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";

interface HealthCertificatePreviewProps {
  certificateUrl: string;
  certificateName?: string | null;
  onBack: () => void;
}

const HealthCertificatePreview = ({ certificateUrl, certificateName, onBack }: HealthCertificatePreviewProps) => {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine file type from URL or name
  const isPdf = (certificateUrl?.toLowerCase().endsWith(".pdf") || certificateName?.toLowerCase().endsWith(".pdf")) ?? false;

  useEffect(() => {
    const getUrl = async () => {
      try {
        const { data } = await supabase.storage
          .from("pet-documents")
          .createSignedUrl(certificateUrl, 600);
        if (data?.signedUrl) {
          setSignedUrl(data.signedUrl);
        }
      } catch {
        // If signed URL fails, try using it as a direct URL
        setSignedUrl(certificateUrl);
      } finally {
        setLoading(false);
      }
    };
    getUrl();
  }, [certificateUrl]);

  const handleDownload = () => {
    if (signedUrl) {
      window.open(signedUrl, "_blank");
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({ title: "Health Certificate", url: signedUrl || certificateUrl });
    } catch {
      if (signedUrl) navigator.clipboard.writeText(signedUrl);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#F5F6F8] flex flex-col">
      {/* Top App Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#F5F6F8]">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-[#E8E8EA] flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[#333]" />
        </button>
        <h1 className="text-[17px] font-bold text-[#151B32]">Health Certificate</h1>
        <button onClick={handleShare} className="w-10 h-10 rounded-full bg-[#E8E8EA] flex items-center justify-center">
          <Share2 className="w-5 h-5 text-[#333]" />
        </button>
      </div>

      {/* Certificate Content - scrollable */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {/* Certificate Frame */}
        <div className="bg-white rounded-[20px] shadow-lg p-3 md:p-4">
          {loading ? (
            <div className="aspect-[3/4] bg-[#F5F5F7] rounded-2xl animate-pulse flex items-center justify-center">
              <p className="text-[#999] text-sm">Loading certificate...</p>
            </div>
          ) : signedUrl ? (
            isPdf ? (
              <iframe
                src={signedUrl}
                title="Health Certificate PDF"
                className="w-full rounded-2xl border-0"
                style={{ minHeight: "500px", height: "70vh" }}
              />
            ) : (
              <img
                src={signedUrl}
                alt="Health Certificate"
                className="w-full rounded-2xl"
                style={{ maxHeight: "none", height: "auto" }}
              />
            )
          ) : (
            <div className="aspect-[3/4] bg-[#F5F5F7] rounded-2xl flex items-center justify-center">
              <p className="text-[#999] text-sm">Certificate not available</p>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <p className="text-center text-[13px] font-medium text-[#999] mt-6 px-4">
          This certificate is digitally signed and verified by the authorized breeder and veterinary clinic.
        </p>

        {/* Download Button */}
        <div className="mt-6 px-5">
          <button
            onClick={handleDownload}
            className="w-full h-[60px] rounded-[40px] text-white text-[15px] font-bold flex items-center justify-center gap-2.5 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #A855F7, #EC4899)",
            }}
          >
            <Download className="w-5 h-5" />
            Download Certificate
          </button>
        </div>

        {/* Security text */}
        <div className="flex items-center justify-center gap-1.5 mt-4 mb-6">
          <Lock className="w-3.5 h-3.5 text-[#999]" />
          <span className="text-[11px] text-[#999]">Securely encrypted document</span>
        </div>
      </div>
    </div>
  );
};

export default HealthCertificatePreview;
