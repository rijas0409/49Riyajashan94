import { AdminData } from "@/pages/AdminDashboard";
import { useState } from "react";
import { Search, CheckCircle2, XCircle, Package, Eye, X, FileText, Camera, MapPin, Calendar, Weight, Tag, Truck, ShieldCheck, Utensils, Beaker } from "lucide-react";

interface Props {
  data: AdminData;
  actions: any;
}

const DocViewer = ({ label, url }: { label: string; url: string | null }) => {
  if (!url) return (
    <div className="flex items-center gap-2 p-3 bg-[hsl(0,50%,97%)] rounded-xl border border-[hsl(0,40%,90%)]">
      <FileText className="w-4 h-4 text-[hsl(0,50%,60%)]" />
      <span className="text-sm text-[hsl(0,50%,50%)]">{label}: Not uploaded</span>
    </div>
  );
  const isImage = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
  return (
    <div className="rounded-xl border border-[hsl(220,20%,90%)] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-[hsl(220,20%,97%)]">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[hsl(220,80%,50%)]" />
          <span className="text-sm font-medium text-[hsl(220,20%,25%)]">{label}</span>
        </div>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-medium text-[hsl(220,80%,50%)] hover:underline">Open Full</a>
      </div>
      {isImage ? (
        <img src={url} alt={label} className="w-full max-h-[200px] object-contain bg-[hsl(220,20%,98%)]" />
      ) : (
        <div className="p-4 bg-[hsl(220,20%,98%)] text-center">
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-[hsl(220,80%,50%)] hover:underline">View Document ↗</a>
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="w-4 h-4 text-[hsl(220,15%,55%)] mt-0.5 shrink-0" />
    <div>
      <p className="text-[11px] text-[hsl(220,15%,60%)] uppercase tracking-wide">{label}</p>
      <p className="text-sm font-medium text-[hsl(220,20%,15%)]">{value || "Not provided"}</p>
    </div>
  </div>
);

const AdminProducts = ({ data, actions }: Props) => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const filtered = data.allProducts.filter((p: any) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.verification_status === filter;
    return matchSearch && matchFilter;
  });

  const pendingProducts = data.pendingProducts;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-[hsl(220,20%,15%)]">Product Management</h1>
        <p className="text-sm text-[hsl(220,15%,55%)] mt-1">Manage shop products and verifications</p>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setSelectedProduct(null)}>
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-[hsl(220,20%,92%)] px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-[hsl(220,20%,15%)]">Product Review</h2>
                <p className="text-[12px] text-[hsl(220,15%,55%)]">Listed {new Date(selectedProduct.created_at).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="w-8 h-8 rounded-lg bg-[hsl(220,20%,96%)] flex items-center justify-center hover:bg-[hsl(220,20%,92%)]">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Images */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3 flex items-center gap-2"><Camera className="w-4 h-4" /> Product Images ({selectedProduct.images.length})</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedProduct.images.map((img: string, i: number) => (
                      <a key={i} href={img} target="_blank" rel="noopener noreferrer" className="aspect-square rounded-xl overflow-hidden bg-[hsl(220,20%,94%)] hover:opacity-80 transition-opacity">
                        <img src={img} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {selectedProduct.videos && selectedProduct.videos.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3">Videos ({selectedProduct.videos.length})</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProduct.videos.map((vid: string, i: number) => (
                      <video key={i} src={vid} controls className="w-full rounded-xl" />
                    ))}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="bg-[hsl(220,20%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3 flex items-center gap-2"><Package className="w-4 h-4" /> Product Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <InfoRow icon={Package} label="Product Name" value={selectedProduct.name} />
                  <InfoRow icon={Tag} label="Brand" value={selectedProduct.brand} />
                  <InfoRow icon={Package} label="Category" value={selectedProduct.category} />
                  <InfoRow icon={Package} label="Pet Type" value={selectedProduct.pet_type} />
                  <InfoRow icon={FileText} label="SKU" value={selectedProduct.sku} />
                  <InfoRow icon={MapPin} label="Country of Origin" value={selectedProduct.country_of_origin} />
                  <InfoRow icon={Weight} label="Weight" value={selectedProduct.weight ? `${selectedProduct.weight} ${selectedProduct.unit || ""}` : null} />
                </div>
              </div>

              {/* Description */}
              {selectedProduct.description && (
                <div className="bg-[hsl(220,20%,97%)] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-2">Description</h4>
                  <p className="text-sm text-[hsl(220,15%,40%)] leading-relaxed">{selectedProduct.description}</p>
                </div>
              )}

              {/* Highlights */}
              {selectedProduct.highlights && selectedProduct.highlights.length > 0 && (
                <div className="bg-[hsl(145,30%,97%)] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-2">Highlights</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedProduct.highlights.map((h: string, i: number) => (
                      <li key={i} className="text-sm text-[hsl(220,15%,40%)]">{h}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Ingredients */}
              {selectedProduct.ingredients && selectedProduct.ingredients.length > 0 && (
                <div className="bg-[hsl(40,40%,97%)] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-2 flex items-center gap-2"><Beaker className="w-4 h-4" /> Ingredients</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedProduct.ingredients.map((ing: string, i: number) => (
                      <span key={i} className="px-2.5 py-1 bg-white border border-[hsl(40,40%,85%)] rounded-lg text-[12px] text-[hsl(220,15%,40%)]">{ing}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feeding Guide */}
              {selectedProduct.feeding_guide && Array.isArray(selectedProduct.feeding_guide) && selectedProduct.feeding_guide.length > 0 && (
                <div className="bg-[hsl(270,30%,97%)] rounded-xl p-4">
                  <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-2 flex items-center gap-2"><Utensils className="w-4 h-4" /> Feeding Guide</h4>
                  <div className="space-y-1">
                    {selectedProduct.feeding_guide.map((fg: any, i: number) => (
                      <p key={i} className="text-sm text-[hsl(220,15%,40%)]">{typeof fg === "string" ? fg : JSON.stringify(fg)}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing & Inventory */}
              <div className="bg-[hsl(145,30%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3">Pricing & Inventory</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <InfoRow icon={Tag} label="Price" value={`₹${selectedProduct.price}`} />
                  {selectedProduct.original_price && <InfoRow icon={Tag} label="Original Price" value={`₹${selectedProduct.original_price}`} />}
                  {selectedProduct.discount > 0 && <InfoRow icon={Tag} label="Discount" value={`${selectedProduct.discount}%`} />}
                  <InfoRow icon={Package} label="Stock" value={`${selectedProduct.stock} units`} />
                  <InfoRow icon={FileText} label="GST Inclusive" value={selectedProduct.gst_inclusive ? "Yes" : "No"} />
                  {selectedProduct.tax_percentage > 0 && <InfoRow icon={FileText} label="Tax" value={`${selectedProduct.tax_percentage}%`} />}
                </div>
              </div>

              {/* Shipping */}
              <div className="bg-[hsl(220,20%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3 flex items-center gap-2"><Truck className="w-4 h-4" /> Shipping Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <InfoRow icon={Truck} label="Shipping Free" value={selectedProduct.shipping_free ? "Yes" : "No"} />
                  {!selectedProduct.shipping_free && <InfoRow icon={Tag} label="Shipping Charges" value={`₹${selectedProduct.shipping_charges}`} />}
                  <InfoRow icon={MapPin} label="Dispatch City" value={selectedProduct.dispatch_city} />
                  <InfoRow icon={FileText} label="Handling Time" value={selectedProduct.handling_time} />
                  <InfoRow icon={MapPin} label="Delivery Scope" value={selectedProduct.delivery_scope} />
                </div>
              </div>

              {/* Compliance */}
              <div className="bg-[hsl(40,40%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3 flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Compliance</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  <InfoRow icon={Calendar} label="Expiry Date" value={selectedProduct.expiry_date} />
                  <InfoRow icon={FileText} label="Batch Number" value={selectedProduct.batch_number} />
                  <InfoRow icon={FileText} label="Storage Instructions" value={selectedProduct.storage_instructions} />
                  <InfoRow icon={FileText} label="Return Policy" value={selectedProduct.return_policy} />
                  <InfoRow icon={FileText} label="Warranty" value={selectedProduct.warranty} />
                </div>
              </div>

              {/* Documents */}
              <div>
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-3">Uploaded Documents</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <DocViewer label="GST Certificate" url={selectedProduct.gst_certificate} />
                  <DocViewer label="Trade License" url={selectedProduct.trade_license} />
                  <DocViewer label="FSSAI Certificate" url={selectedProduct.fssai_certificate} />
                  <DocViewer label="Brand Authorization" url={selectedProduct.brand_authorization} />
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-[hsl(270,30%,97%)] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[hsl(220,20%,15%)] mb-2">Seller Information</h4>
                <InfoRow icon={Package} label="Seller Name" value={selectedProduct.seller?.name} />
                <InfoRow icon={FileText} label="Seller Phone" value={selectedProduct.seller?.phone} />
              </div>

              {selectedProduct.priority_fee_paid && (
                <div className="flex items-center gap-2 p-3 bg-[hsl(35,90%,95%)] rounded-xl border border-[hsl(35,80%,80%)]">
                  <ShieldCheck className="w-5 h-5 text-[hsl(35,80%,40%)]" />
                  <span className="text-sm font-semibold text-[hsl(35,80%,35%)]">Priority Verification Paid</span>
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="sticky bottom-0 bg-white border-t border-[hsl(220,20%,92%)] px-6 py-4 flex justify-end gap-3 rounded-b-2xl">
              <button onClick={() => { actions.rejectProduct(selectedProduct.id); setSelectedProduct(null); }} className="px-6 py-2.5 border border-[hsl(0,60%,70%)] text-[hsl(0,65%,50%)] text-sm font-medium rounded-xl hover:bg-[hsl(0,60%,97%)] flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Reject Product
              </button>
              <button onClick={() => { actions.verifyProduct(selectedProduct.id); setSelectedProduct(null); }} className="px-6 py-2.5 bg-[hsl(145,55%,42%)] text-white text-sm font-medium rounded-xl hover:bg-[hsl(145,55%,38%)] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Approve Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pending */}
      {pendingProducts.length > 0 && (
        <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6 mb-6">
          <h2 className="text-lg font-bold text-[hsl(220,20%,15%)] mb-4 flex items-center gap-2">
            Pending Verifications
            <span className="px-2.5 py-0.5 bg-[hsl(0,75%,55%)] text-white text-[11px] font-bold rounded-full">{pendingProducts.length}</span>
          </h2>
          <div className="space-y-3">
            {pendingProducts.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-[hsl(40,60%,97%)] rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[hsl(220,20%,94%)]">
                    {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-[hsl(220,15%,60%)]" /></div>}
                  </div>
                  <div>
                    <p className="font-semibold text-[hsl(220,20%,15%)] text-sm">{p.name}</p>
                    <p className="text-[12px] text-[hsl(220,15%,55%)]">{p.brand} • ₹{p.price} • By {p.seller?.name || "Unknown"}</p>
                    {p.priority_fee_paid && <span className="inline-block mt-0.5 px-2 py-0.5 bg-[hsl(35,90%,90%)] text-[hsl(35,80%,35%)] text-[10px] font-bold rounded-md">PRIORITY</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedProduct(p)} className="px-4 py-2 bg-white border border-[hsl(220,20%,85%)] text-[hsl(220,15%,40%)] text-[12px] font-medium rounded-lg hover:bg-[hsl(220,20%,96%)] flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> Review
                  </button>
                  <button onClick={() => actions.verifyProduct(p.id)} className="px-4 py-2 bg-[hsl(220,80%,50%)] text-white text-[12px] font-medium rounded-lg hover:bg-[hsl(220,80%,45%)] flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button onClick={() => actions.rejectProduct(p.id)} className="px-4 py-2 border border-[hsl(0,60%,70%)] text-[hsl(0,65%,50%)] text-[12px] font-medium rounded-lg hover:bg-[hsl(0,60%,97%)] flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Products */}
      <div className="bg-white rounded-2xl border border-[hsl(220,20%,92%)] p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(220,15%,60%)]" />
            <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[hsl(220,20%,97%)] border border-[hsl(220,20%,92%)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(220,80%,50%)]/20"
            />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="px-4 py-2.5 border border-[hsl(220,20%,88%)] rounded-xl text-sm bg-white focus:outline-none">
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="failed">Rejected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(220,20%,92%)]">
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Product</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Brand</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Price</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Stock</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Status</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Seller</th>
                <th className="pb-3 text-left font-semibold text-[hsl(220,15%,55%)]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-[hsl(220,15%,60%)]">No products found</td></tr>
              ) : (
                filtered.slice(0, 50).map((p: any) => (
                  <tr key={p.id} className="border-b border-[hsl(220,20%,95%)] hover:bg-[hsl(220,20%,98%)]">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-[hsl(220,20%,94%)]">
                          {p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-4 h-4 text-[hsl(220,15%,60%)]" /></div>}
                        </div>
                        <p className="font-medium text-[hsl(220,20%,15%)]">{p.name}</p>
                      </div>
                    </td>
                    <td className="py-3 text-[hsl(220,15%,45%)]">{p.brand || "—"}</td>
                    <td className="py-3 font-medium text-[hsl(220,20%,15%)]">₹{p.price}</td>
                    <td className="py-3 text-[hsl(220,15%,45%)]">{p.stock}</td>
                    <td className="py-3">
                      <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                        p.verification_status === "verified" ? "bg-[hsl(145,50%,92%)] text-[hsl(145,60%,35%)]" :
                        p.verification_status === "pending" ? "bg-[hsl(40,60%,92%)] text-[hsl(40,70%,35%)]" :
                        "bg-[hsl(0,50%,93%)] text-[hsl(0,65%,45%)]"
                      }`}>{p.verification_status}</span>
                    </td>
                    <td className="py-3 text-[hsl(220,15%,45%)]">{p.seller?.name || "—"}</td>
                    <td className="py-3">
                      <button onClick={() => setSelectedProduct(p)} className="text-[12px] text-[hsl(220,80%,50%)] font-medium hover:underline flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
