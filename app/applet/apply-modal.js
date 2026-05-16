const fs = require('fs');
const content = fs.readFileSync('src/components/admin/AdminUserManagement.tsx', 'utf8');

// replace imports
let newContent = content.replace(
  'import { Search, CheckCircle2, XCircle, Users, Shield, ShoppingBag, Truck as TruckIcon, Stethoscope, Eye, X, FileText, Camera, MapPin, Phone, Mail, Building, Trash2, AlertTriangle, GraduationCap, Clock, Banknote, Calendar, User, Building2, CreditCard, ScrollText } from "lucide-react";',
  'import { Search, CheckCircle2, XCircle, Users, Shield, ShoppingBag, Truck as TruckIcon, Stethoscope, Eye, X, FileText, Camera, MapPin, Phone, Mail, Building, Trash2, AlertTriangle, GraduationCap, Clock, Banknote, Calendar, User, Building2, CreditCard, ScrollText, ChevronLeft, ChevronRight, Globe, Activity, Briefcase, AlertCircle } from "lucide-react";'
);

// add InfoBox
newContent = newContent.replace(
  'const DocViewer =',
  `const InfoBox = ({ icon: Icon, label, value, capitalize = false, muted = false, isPill = false }: any) => (
  <div className="flex items-start gap-4">
    <div className="bg-[hsl(250,80%,96%)] text-[hsl(250,60%,60%)] p-3 rounded-2xl flex items-center justify-center shrink-0">
      <Icon className="w-5 h-5" />
    </div>
    <div>
      <div className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-1">{label}</div>
      {isPill ? (
        <span className="inline-flex bg-[hsl(220,20%,96%)] text-[hsl(220,20%,40%)] px-2.5 py-1 rounded-md text-[13px] font-semibold mt-0.5">{value}</span>
      ) : (
        <div className={\`text-[15px] font-medium leading-snug \${muted ? 'text-[hsl(220,15%,60%)]' : 'text-[hsl(220,20%,15%)]'} \${capitalize ? 'capitalize' : ''}\`}>
          {value || "—"}
        </div>
      )}
    </div>
  </div>
);

const DocViewer =`
);

// replace Modal.
const startIndex = newContent.indexOf('      {/* Detail Review Modal */}');
const endIndex = newContent.indexOf('      {/* Pending Approvals */}');

const newModal = `      {/* Detail Review Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[hsl(220,50%,15%)]/40 p-4 sm:p-6 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
          <div className="bg-white rounded-[24px] w-full max-w-[1000px] flex flex-col md:flex-row shadow-2xl relative max-h-[90vh] md:h-[650px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setSelectedUser(null)} className="absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center text-[hsl(220,15%,60%)] hover:bg-[hsl(220,20%,96%)] hover:text-[hsl(220,20%,20%)] transition-colors z-[110]">
              <X className="w-5 h-5" />
            </button>

            {/* Sidebar */}
            <aside className="w-full md:w-[320px] bg-[hsl(220,50%,98%)] border-r border-[hsl(220,20%,92%)] p-6 sm:p-10 flex flex-col items-center overflow-y-auto shrink-0 hidden sm:flex">
              <div className="w-24 h-24 rounded-full bg-white border border-[hsl(220,20%,90%)] shadow-sm flex items-center justify-center relative mb-5 overflow-hidden text-[hsl(220,15%,70%)]">
                {selectedUser.profile_photo || selectedUser.selfie_file || selectedUser.passport_photo_file ? (
                  <img src={selectedUser.profile_photo || selectedUser.selfie_file || selectedUser.passport_photo_file} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
                <div className="absolute bottom-1 right-1 w-4 h-4 bg-[hsl(40,90%,50%)] border-[3px] border-white rounded-full"></div>
              </div>
              <h2 className="text-xl font-bold text-[hsl(220,20%,15%)] mb-1 text-center">{selectedUser.full_name || selectedUser.name || "User"}</h2>
              <p className="text-sm text-[hsl(220,15%,55%)] mb-6 text-center">{selectedUser.email}</p>

              <div className="flex items-center justify-center gap-2 bg-white px-4 py-3 rounded-xl border border-[hsl(220,20%,90%)] shadow-sm mb-8 w-full">
                <div className="w-2 h-2 rounded-full bg-[hsl(40,90%,50%)]"></div>
                <span className="text-xs font-semibold uppercase tracking-wide text-[hsl(220,20%,30%)]">Pending Review</span>
              </div>

              <div className="mt-auto w-full pt-8 border-t border-[hsl(220,20%,90%)]">
                <p className="text-[11px] text-[hsl(220,15%,60%)] uppercase tracking-wider font-semibold text-center mb-4">Application Actions</p>
                <button onClick={() => { handleStatusChange(selectedUser, "approved"); setSelectedUser(null); }} className="w-full flex items-center justify-center gap-2 bg-[hsl(150,80%,40%)] text-white p-3.5 rounded-xl font-semibold text-sm hover:bg-[hsl(150,80%,35%)] shadow-lg shadow-[hsl(150,80%,40%)]/20 transition-all mb-3">
                  <CheckCircle2 className="w-[18px] h-[18px]" /> Approve
                </button>
                <button onClick={() => { setRejectionTarget(selectedUser); setSelectedUser(null); }} className="w-full flex items-center justify-center gap-2 bg-white text-[hsl(340,80%,50%)] border border-[hsl(340,80%,90%)] p-3.5 rounded-xl font-semibold text-sm hover:bg-[hsl(340,80%,98%)] transition-all">
                  <AlertCircle className="w-[18px] h-[18px]" /> Reject with Reason
                </button>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col bg-white overflow-hidden h-full">
              {/* Content Header & Progress */}
              <header className="px-6 sm:px-10 pt-8 sm:pt-10 pb-6 border-b border-[hsl(220,20%,92%)] bg-white shrink-0">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-[hsl(250,60%,60%)] uppercase tracking-wider">
                    {selectedUser.role === 'vet' ? \`Step \${adminVetStep} of 7\` : 'User Details'}
                  </span>
                  <span className="text-[13px] font-medium text-[hsl(220,15%,60%)]">Applied {new Date(selectedUser.created_at).toLocaleDateString()}</span>
                </div>
                <h1 className="text-2xl font-bold text-[hsl(220,20%,15%)] mb-6">
                  {selectedUser.role === 'vet' ? [
                    'Personal Info', 
                    'Identity', 
                    'Professional', 
                    'Clinic Docs', 
                    'Bank Details', 
                    'Availability', 
                    'Compliance'
                  ][adminVetStep - 1] : 'Application Info'}
                </h1>
                
                {selectedUser.role === 'vet' && (
                  <div className="flex gap-2 w-full">
                    {[1,2,3,4,5,6,7].map(n => (
                      <div key={n} className={\`h-1.5 flex-1 rounded-full transition-colors \${n === adminVetStep ? 'bg-[hsl(250,60%,60%)]' : n < adminVetStep ? 'bg-[hsl(250,60%,90%)]' : 'bg-[hsl(220,20%,92%)]'}\`}></div>
                    ))}
                  </div>
                )}
              </header>

              {/* Form Content Grid */}
              <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-white">
                {selectedUser.role === 'vet' ? (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    {adminVetStep === 1 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <InfoBox icon={User} label="Full Name" value={selectedUser.full_name} />
                        <InfoBox icon={Mail} label="Email" value={selectedUser.email} />
                        <InfoBox icon={Phone} label="Phone" value={selectedUser.phone} />
                        <InfoBox icon={Calendar} label="Date of Birth" value={selectedUser.dob || selectedUser.birth_date} />
                        <InfoBox icon={User} label="Gender" value={selectedUser.gender} capitalize />
                        <InfoBox icon={Globe} label="Preferred Language" value={selectedUser.preferred_language || "—"} muted={!selectedUser.preferred_language} />
                        <InfoBox icon={MapPin} label="Address" value={selectedUser.address} />
                        <InfoBox icon={Briefcase} label="Independent Practice" value={selectedUser.self_practice ? "Yes" : "No"} isPill />
                      </div>
                    )}
                    
                    {adminVetStep === 2 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <DocViewer label="Government ID" url={selectedUser.govt_id_file || selectedUser.aadhaar_file} bucket="vet-documents" />
                        <DocViewer label="PAN Card" url={selectedUser.pan_card_file} bucket="vet-documents" />
                        <DocViewer label="Passport Photo" url={selectedUser.passport_photo_file} bucket="vet-documents" />
                      </div>
                    )}

                    {adminVetStep === 3 && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <InfoBox icon={GraduationCap} label="Highest Qualification" value={selectedUser.qualification} />
                          <InfoBox icon={FileText} label="Vet License / Reg #" value={selectedUser.registration_number} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <DocViewer label="Vet Degree Certificate" url={selectedUser.vet_degree_file} bucket="vet-documents" />
                        </div>
                        {selectedUser.education_details && Array.isArray(selectedUser.education_details) && selectedUser.education_details.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-4 block">Education Details List</span>
                            <div className="space-y-3">
                              {selectedUser.education_details.map((edu: any, i: number) => (
                                <div key={i} className="flex flex-wrap items-center gap-3 justify-between p-4 bg-[hsl(220,30%,98%)] rounded-xl border border-[hsl(220,20%,92%)]">
                                  <div>
                                    <p className="text-[15px] font-medium text-[hsl(220,20%,15%)] mb-1">{edu.qualification}</p>
                                    <p className="text-[13px] text-[hsl(220,15%,55%)]">{edu.institution} • {edu.year}</p>
                                  </div>
                                  {edu.certificate_url ? (
                                    <a href={edu.certificate_url.startsWith('http') ? edu.certificate_url : supabase.storage.from('vet-documents').getPublicUrl(edu.certificate_url).data.publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[hsl(220,20%,90%)] rounded-lg text-[13px] font-medium text-[hsl(220,20%,30%)] hover:bg-[hsl(220,20%,96%)] transition-colors" referrerPolicy="no-referrer">
                                      <FileText className="w-4 h-4" /> View Certificate
                                    </a>
                                  ) : (
                                    <span className="text-[12px] font-medium px-2 py-1 bg-[hsl(0,50%,97%)] rounded border border-[hsl(0,50%,90%)] text-[hsl(0,50%,60%)]">No certificate</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {adminVetStep === 4 && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1">
                          <InfoBox icon={MapPin} label="Clinic Address" value={selectedUser.clinic_address} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <DocViewer label="Clinic Registration" url={selectedUser.clinic_registration_file} bucket="vet-documents" />
                          <DocViewer label="Shop License" url={selectedUser.clinic_shop_license_file} bucket="vet-documents" />
                          <DocViewer label="GST Certificate" url={selectedUser.gst_certificate_file} bucket="vet-documents" />
                          <DocViewer label="Address Proof" url={selectedUser.clinic_address_proof_file} bucket="vet-documents" />
                        </div>
                        {Array.isArray(selectedUser.clinic_photos) && selectedUser.clinic_photos.length > 0 && (
                          <div>
                            <span className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-4 block">Clinic Photos</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                              {selectedUser.clinic_photos.map((photoUrl: string, idx: number) => (
                                <DocViewer key={idx} label={\`Clinic Photo \${idx + 1}\`} url={photoUrl} bucket="vet-documents" />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {adminVetStep === 5 && (
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                          <InfoBox icon={FileText} label="Bank Account Name" value={selectedUser.bank_account_name} />
                          <InfoBox icon={Briefcase} label="Bank Name" value={selectedUser.bank_name} />
                          <InfoBox icon={CreditCard} label="Bank Account Number" value={selectedUser.bank_account_number} />
                          <InfoBox icon={Globe} label="Bank IFSC" value={selectedUser.bank_ifsc} />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          <DocViewer label="Cancelled Cheque" url={selectedUser.cancelled_cheque_file} bucket="vet-documents" />
                        </div>
                      </div>
                    )}

                    {adminVetStep === 6 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <InfoBox icon={Users} label="Specializations" value={Array.isArray(selectedUser.specializations) ? selectedUser.specializations.join(", ") : (selectedUser.specializations || "—")} />
                        <InfoBox icon={Activity} label="Consultation Type" value={selectedUser.consultation_type || "—"} />
                        <InfoBox icon={Clock} label="Years of Experience" value={selectedUser.years_of_experience !== undefined ? \`\${selectedUser.years_of_experience}\` : "—"} />
                        <InfoBox icon={Calendar} label="Available Days" value={Array.isArray(selectedUser.available_days) ? selectedUser.available_days.join(", ") : (selectedUser.available_days || "—")} />
                        <InfoBox icon={Clock} label="Available Slots" value={\`Morn: \${selectedUser.morning_slots ? 'Yes' : 'No'} | Eve: \${selectedUser.evening_slots ? 'Yes' : 'No'}\`} />
                        <InfoBox icon={CreditCard} label="Clinic Visit Fee" value={selectedUser.online_fee ? \`₹\${selectedUser.online_fee}\` : "—"} />
                        <InfoBox icon={CreditCard} label="Home Visit Fee" value={selectedUser.offline_fee ? \`₹\${selectedUser.offline_fee}\` : "—"} />
                      </div>
                    )}

                    {adminVetStep === 7 && (
                      <div className="space-y-4 max-w-lg">
                        <div className="flex items-center justify-between p-5 bg-[hsl(220,30%,98%)] rounded-xl border border-[hsl(220,20%,92%)]">
                          <div className="flex items-center gap-3">
                            <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${selectedUser.vendor_agreement_accepted ? 'bg-[hsl(150,80%,90%)] text-[hsl(150,80%,40%)]' : 'bg-[hsl(0,80%,90%)] text-[hsl(0,70%,50%)]'}\`}>
                              {selectedUser.vendor_agreement_accepted ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-[hsl(220,20%,15%)]">Vendor Agreement</p>
                              <p className="text-xs text-[hsl(220,15%,55%)]">{selectedUser.vendor_agreement_accepted ? "Accepted" : "Not accepted"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-[hsl(220,30%,98%)] rounded-xl border border-[hsl(220,20%,92%)]">
                          <div className="flex items-center gap-3">
                            <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${(selectedUser.is_onboarding_complete || selectedUser.created_at) ? 'bg-[hsl(150,80%,90%)] text-[hsl(150,80%,40%)]' : 'bg-[hsl(0,80%,90%)] text-[hsl(0,70%,50%)]'}\`}>
                              {(selectedUser.is_onboarding_complete || selectedUser.created_at) ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium text-[hsl(220,20%,15%)]">Terms & Conditions</p>
                              <p className="text-xs text-[hsl(220,15%,55%)]">{(selectedUser.is_onboarding_complete || selectedUser.created_at) ? "Accepted" : "Not accepted"}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-5 bg-[hsl(220,30%,98%)] rounded-xl border border-[hsl(220,20%,92%)]">
                          <div className="flex items-center gap-3">
                            <div className={\`w-10 h-10 rounded-full flex items-center justify-center \${selectedUser.telemedicine_consent_accepted ? 'bg-[hsl(150,80%,90%)] text-[hsl(150,80%,40%)]' : 'bg-[hsl(220,20%,90%)] text-[hsl(220,15%,60%)]'}\`}>
                              {selectedUser.telemedicine_consent_accepted ? <CheckCircle2 className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5 opacity-50" />}
                            </div>
                            <div>
                              <p className="font-medium text-[hsl(220,20%,15%)]">Telemedicine Consent</p>
                              <p className="text-xs text-[hsl(220,15%,55%)]">{selectedUser.telemedicine_consent_accepted ? "Accepted" : "Pending"}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-10 animate-in fade-in duration-300">
                    <div>
                      <span className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-6 block">Primary Details</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <InfoBox icon={User} label="Full Name" value={selectedUser.full_name} />
                        <InfoBox icon={User} label="Display Name" value={selectedUser.name} />
                        <InfoBox icon={Mail} label="Email" value={selectedUser.email} />
                        <InfoBox icon={Phone} label="Phone" value={selectedUser.phone} />
                        <InfoBox icon={MapPin} label="Address" value={selectedUser.address} />
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-[11px] font-bold text-[hsl(220,15%,60%)] uppercase tracking-wider mb-6 block">Verification Documents</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <DocViewer label="Government ID" url={selectedUser.aadhaar_file} bucket="seller-documents" />
                        <DocViewer label="PAN Card" url={selectedUser.pan_card_file} bucket="seller-documents" />
                        <DocViewer label="Live Selfie" url={selectedUser.selfie_file} bucket="seller-documents" />
                        <DocViewer label="Breeder License" url={selectedUser.breeder_license} bucket="seller-documents" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Footer */}
              <footer className="px-6 sm:px-10 py-5 sm:py-6 border-t border-[hsl(220,20%,92%)] bg-[hsl(220,50%,99%)] flex items-center justify-between shrink-0">
                {selectedUser.role === 'vet' ? (
                  <>
                    <button 
                      onClick={() => setAdminVetStep(Math.max(1, adminVetStep - 1))} 
                      disabled={adminVetStep === 1}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[15px] border border-transparent disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[hsl(220,20%,90%)] text-[hsl(220,20%,30%)] transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" /> Previous
                    </button>
                    {adminVetStep < 7 ? (
                      <button 
                        onClick={() => setAdminVetStep(Math.min(7, adminVetStep + 1))} 
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[15px] bg-[hsl(220,20%,10%)] text-white shadow-lg shadow-[hsl(220,20%,10%)]/15 hover:bg-[hsl(220,20%,20%)] transition-all ml-auto"
                      >
                        Next Step <ChevronRight className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => { handleStatusChange(selectedUser, "approved"); setSelectedUser(null); }} 
                        className="flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-[15px] bg-[hsl(150,80%,40%)] text-white shadow-lg shadow-[hsl(150,80%,40%)]/20 hover:bg-[hsl(150,80%,35%)] transition-all ml-auto"
                      >
                        Approve <CheckCircle2 className="w-5 h-5" />
                      </button>
                    )}
                  </>
                ) : (
                  <div className="flex w-full justify-between items-center">
                    <span className="text-sm font-medium text-[hsl(220,15%,60%)]">Review complete?</span>
                    <div className="flex gap-3">
                      <button onClick={() => { setRejectionTarget(selectedUser); setSelectedUser(null); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm border border-[hsl(340,80%,85%)] text-[hsl(340,80%,50%)] bg-white hover:bg-[hsl(340,80%,98%)] transition-all">
                        Reject
                      </button>
                      <button onClick={() => { handleStatusChange(selectedUser, "approved"); setSelectedUser(null); }} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm bg-[hsl(150,80%,40%)] text-white shadow-lg shadow-[hsl(150,80%,40%)]/20 hover:bg-[hsl(150,80%,35%)] transition-all">
                        <CheckCircle2 className="w-[18px] h-[18px]" /> Approve
                      </button>
                    </div>
                  </div>
                )}
              </footer>
            </main>
          </div>
        </div>
      )}
\n`;

newContent = newContent.slice(0, startIndex) + newModal + newContent.slice(endIndex);
fs.writeFileSync('src/components/admin/AdminUserManagement.tsx', newContent);
console.log('Update complete');
