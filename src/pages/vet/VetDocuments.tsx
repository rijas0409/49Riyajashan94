import React from "react";
import { useNavigate } from "react-router-dom";
import { CaretLeft, FileText, CheckCircle } from "@phosphor-icons/react";

const VetDocuments = () => {
  const navigate = useNavigate();

  const documents = [
    { name: "Government ID", status: "Verified" },
    { name: "PAN Card", status: "Verified" },
    { name: "Veterinary Degree", status: "Verified" },
    { name: "Clinic Registration", status: "Verified" },
  ];

  return (
    <div className="bg-[#FDFBFF] min-h-screen pb-24 font-sans text-slate-900 selection:bg-purple-100">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md px-4 py-4 flex items-center border-b border-transparent">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-700 hover:bg-slate-50 rounded-full transition-colors mr-4">
          <CaretLeft size={24} weight="bold" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Documents</h1>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-4">
        {documents.map((doc, idx) => (
          <div key={idx} className="bg-white rounded-2xl p-5 flex items-center gap-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-slate-100">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-500 shrink-0">
              <FileText size={24} weight="bold" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-sm sm:text-base">{doc.name}</p>
              <div className="flex items-center gap-1 text-green-500 text-xs sm:text-sm font-semibold mt-0.5">
                <CheckCircle size={16} weight="fill" />
                {doc.status}
              </div>
            </div>
            <button className="text-xs sm:text-sm font-bold text-purple-600 bg-purple-50 px-3 sm:px-4 py-2 rounded-xl hover:bg-purple-100 transition-colors active:scale-95">
              View
            </button>
          </div>
        ))}
      </main>
    </div>
  );
};

export default VetDocuments;
