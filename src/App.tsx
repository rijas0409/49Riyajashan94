import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { LocationProvider, useLocation as useCityLocation } from "./contexts/LocationContext";
import { VetProtectionWrapper } from "./components/VetProtectionWrapper";
import { CartProvider } from "./contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";

// Pages
import Index from "./pages/Index";
import AddPet from "./pages/AddPet";
import AddProduct from "./pages/AddProduct";
import Addresses from "./pages/Addresses";
import AdminDashboard from "./pages/AdminDashboard";
import Auth from "./pages/Auth";
import AuthAdmin from "./pages/AuthAdmin";
import AuthBreeder from "./pages/AuthBreeder";
import AuthBuyer from "./pages/AuthBuyer";
import AuthDelivery from "./pages/AuthDelivery";
import AuthProducts from "./pages/AuthProducts";
import AuthVet from "./pages/AuthVet";
import Bookings from "./pages/Bookings";
import BrandProfile from "./pages/BrandProfile";
import BuyerDashboard from "./pages/BuyerDashboard";
import Cart from "./pages/Cart";
import Chats from "./pages/Chats";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import EditPet from "./pages/EditPet";
import NotFound from "./pages/NotFound";
import Notifications from "./pages/Notifications";
import PetDetails from "./pages/PetDetails";
import PrivacySecurity from "./pages/PrivacySecurity";
import ProductOrders from "./pages/ProductOrders";
import ProductProfile from "./pages/ProductProfile";
import ProductsDashboard from "./pages/ProductsDashboard";
import ProductsOnboarding from "./pages/ProductsOnboarding";
import ProductsPendingApproval from "./pages/ProductsPendingApproval";
import ProfileMenu from "./pages/ProfileMenu";
import ProfileSettings from "./pages/ProfileSettings";
import EmptyPetPassport from "./pages/EmptyPetPassport";
import PublicPetPassport from "./pages/PublicPetPassport";
import SellerDashboard from "./pages/SellerDashboard";
import SellerOnboarding from "./pages/SellerOnboarding";
import SellerPendingApproval from "./pages/SellerPendingApproval";
import SellerProfile from "./pages/SellerProfile";
import Shop from "./pages/Shop";
import Vet from "./pages/Vet";
import VetHome from "./pages/VetHome";
import VetOnboarding from "./pages/VetOnboarding";
import VetPendingApproval from "./pages/VetPendingApproval";
import WalletPage from "./pages/WalletPage";
import Wishlist from "./pages/Wishlist";

// Care Plan
import CarePlanForm from "./pages/care-plan/CarePlanForm";
import CarePlanFormStep2 from "./pages/care-plan/CarePlanFormStep2";
import CarePlanIntro from "./pages/care-plan/CarePlanIntro";
import CarePlanReport from "./pages/care-plan/CarePlanReport";

// Vet
import AIAnalyzingCondition from "./pages/vet/AIAnalyzingCondition";
import AIVetAssessment from "./pages/vet/AIVetAssessment";
import AIVetAssistant from "./pages/vet/AIVetAssistant";
import BookingDetails from "./pages/vet/BookingDetails";
import ConnectionReady from "./pages/vet/ConnectionReady";
import ConsultationPlan from "./pages/vet/ConsultationPlan";
import ConsultationSummary from "./pages/vet/ConsultationSummary";
import ConsultationConfirmation from "./pages/vet/ConsultationConfirmation";
import ClinicBookingConfirmation from "./pages/vet/ClinicBookingConfirmation";
import DigitalPrescription from "./pages/vet/DigitalPrescription";
import FindingVet from "./pages/vet/FindingVet";
import InstantAnalyzing from "./pages/vet/InstantAnalyzing";
import InstantAssessment from "./pages/vet/InstantAssessment";
import CareMatchAssessment from "./pages/vet/CareMatchAssessment";
import InstantVideoCall from "./pages/vet/InstantVideoCall";
import PaymentFailed from "./pages/vet/PaymentFailed";
import PaymentSummary from "./pages/vet/PaymentSummary";
import PreparingPrescription from "./pages/vet/PreparingPrescription";
import VetDoctorProfile from "./pages/vet/VetDoctorProfile";
import VetsNearYou from "./pages/vet/VetsNearYou";
import ClinicsNearby from "./pages/vet/ClinicsNearby";
import ClinicDetails from "./pages/vet/ClinicDetails";
import AllSpecializedVets from "./pages/vet/AllSpecializedVets";
import ConsultationDetail from "./pages/vet/ConsultationDetail";
import ConsultationAnalysisSummary from "./pages/vet/ConsultationAnalysisSummary";
import BuyerVisitDetails from "./pages/vet/BuyerVisitDetails";
import VetScheduleVisitDetails from "./pages/vet/VetScheduleVisitDetails";
import AppointmentConfirmation from "./pages/vet/AppointmentConfirmation";
import CreatePrescription from "./pages/vet/CreatePrescription";
import VideoCall from "./pages/vet/VideoCall";

import VetSchedule from "./pages/vet/VetSchedule";
import VetEarnings from "./pages/vet/VetEarnings";
import VetProfile from "./pages/vet/VetProfile";
import VetProfileSettings from "./pages/vet/VetProfileSettings";
import VetContactDetails from "./pages/vet/VetContactDetails";
import VetWallet from "./pages/vet/VetWallet";
import VetDocuments from "./pages/vet/VetDocuments";
import VetPromoteProfile from "./pages/vet/VetPromoteProfile";
import VetRecentReviews from "./pages/vet/VetRecentReviews";
import MyServices from "./pages/vet/MyServices";
import VirtualConsults from "./pages/vet/VirtualConsults";

import React, { Component, ReactNode, useEffect, useState } from "react";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, whiteSpace: "pre-wrap", color: "red" }}>
          <h2>Something went wrong.</h2>
          <p>{this.state.error?.toString()}</p>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.errorInfo?.componentStack}
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}

const RouteTracker = () => {
  const location = useLocation();

  React.useEffect(() => {
    const currentPath = location.pathname;
    const isProfileRoute = [
      "/buyer/profile",
      "/buyer/profile-menu",
      "/buyer/profile-settings",
      "/buyer/pet-passport",
      "/passport",
      "/addresses",
      "/wallet",
      "/buyer/bookings",
      "/bookings",
      "/product-orders",
      "/notifications",
      "/privacy"
    ].some(path => currentPath.startsWith(path));

    if (!isProfileRoute) {
      sessionStorage.setItem("last_main_entry_path", currentPath);
    }
  }, [location]);

  return null;
};

const queryClient = new QueryClient();

const GlobalSmartMatchIframe = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { city } = useCityLocation();
  const isMatch = location.pathname === "/buyer/care-match";
  const [loading, setLoading] = useState(false);
  const [showAssessment, setShowAssessment] = useState(false);
  const matchedVetResultRef = useRef<any>(null);

  useEffect(() => {
    if (!isMatch) {
      setLoading(false);
      setShowAssessment(false);
    }
  }, [isMatch]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.data) return;

      if (event.data.type === "SUBMIT_SMART_MATCH") {
        const payload = event.data.payload;
        const iframe = document.querySelector('iframe[title="Sruvo - Care Match Loading"]') as HTMLIFrameElement;

        try {
          // 1. Save data to Supabase exactly as-is
          if (user) {
            await supabase.from("smart_match_submissions").insert([{
              user_id: user.id,
              pet_data: payload.pet,
              concerns: payload.concerns,
              health_background: payload.healthBackground,
              current_health_status: payload.currentHealthStatus,
              media_files: payload.mediaFiles
            }]);
          }

          // Show loading screen only after DB insert
          setLoading(true);

          // 2. AI + Algorithm Matching Engine
          // Ensure loading UI shows for at least a few seconds
          await new Promise(resolve => setTimeout(resolve, 3000));

          let elapsed = 0;
          let matchedVet = null;

          while (elapsed < 49000) {
            const { data: vets, error } = await supabase
              .from("vet_profiles")
              .select("*")
              .eq("city", city || "Mumbai") // Strict city matching
              .eq("is_verified", true);

            if (error) {
              console.error("Error fetching vets:", error);
            }

            if (vets && vets.length > 0) {
              // Find a vet matching expertise, defaulting to first available in city if no exact match
              matchedVet = vets.find(v => {
                const spec = (v.specialization || "").toLowerCase();
                return payload.concerns?.some((c: any) => 
                  spec.includes(c.question.toLowerCase()) || spec.includes(c.answer.toLowerCase())
                );
              });
              
              if (!matchedVet) {
                matchedVet = vets[0]; // Fallback to first available in city
              }
              break;
            }

            // Wait 5 seconds before trying again if no vets found in city
            await new Promise(r => setTimeout(r, 5000));
            elapsed += 5000;
          }

          if (matchedVet) {
            const formattedVet = {
              id: matchedVet.id, 
              userId: matchedVet.id,
              name: matchedVet.name || "Dr. matched", 
              specialization: matchedVet.title || matchedVet.specialization || "Veterinarian", 
              image: matchedVet.profile_image || "https://images.unsplash.com/photo-1612349317150-e410f624c427?auto=format&fit=crop&q=80&w=200", 
              rating: matchedVet.rating || 4.8, 
              experience: matchedVet.years_exp || 5, 
              location: matchedVet.city || city, 
              consultationFee: matchedVet.consultation_fee || 500,
              nextAvailable: "Available Today",
              about: matchedVet.about || "Expert in veterinary care.",
              languages: ['English'],
              education: []
            };
            matchedVetResultRef.current = formattedVet;
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({ type: "MATCH_FOUND" }, "*");
            }
          } else {
            console.warn("No vets found in the selected city after 49s");
            matchedVetResultRef.current = null;
            if (iframe && iframe.contentWindow) {
              iframe.contentWindow.postMessage({ type: "NO_VET_FOUND" }, "*");
            }
          }
        } catch (error) {
          console.error("Match error:", error);
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: "NO_VET_FOUND" }, "*");
          }
        }
      } else if (event.data.type === "NAVIGATE_PARENT") {
        if (event.data.path === "/vet/ai-assistant") {
          setShowAssessment(false);
          return;
        }
        navigate(event.data.path);
      } else if (event.data.type === "MATCH_COMPLETE") {
        setLoading(false);
        setShowAssessment(false);
        if (matchedVetResultRef.current) {
          navigate("/vet/booking-details", { state: { matchedVet: matchedVetResultRef.current } });
        } else {
          navigate("/buyer/vet");
        }
      } else if (event.data.type === "CANCEL_LOADING") {
        setLoading(false);
      } else if (event.data.type === "CLOSE_LOADING") {
        setLoading(false);
        setShowAssessment(false);
        navigate("/buyer/vet");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [navigate, user, city]);

  useEffect(() => {
    if (loading) {
      const iframe = document.querySelector('iframe[title="Sruvo - Care Match Loading"]') as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: "START_LOADING" }, "*");
      }
    }
  }, [loading]);

  const mainIframeSrc = user ? `/smartmatch.html?userId=${user.id}` : "/smartmatch.html";
  const loadingIframeSrc = "/smartmatchloading.html";

  return (
    <div
      className={`fixed inset-0 w-screen h-screen overflow-hidden bg-white z-[9999] transition-opacity duration-200 ${
        isMatch ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      style={{
        visibility: isMatch ? "visible" : "hidden",
      }}
    >
      {/* Introduction Screen */}
      <div 
        className="absolute inset-0 w-full h-full bg-white transition-opacity duration-300"
        style={{
          opacity: showAssessment ? 0 : 1,
          pointerEvents: showAssessment ? "none" : "auto",
          zIndex: showAssessment ? 30 : 10,
        }}
      >
        <AIVetAssistant
          onStartAssessment={() => setShowAssessment(true)}
          onClose={() => navigate("/buyer/vet")}
        />
      </div>

      {/* Assessment Iframe Screens */}
      <div 
        className="absolute inset-0 w-full h-full bg-white"
        style={{
          zIndex: showAssessment ? 20 : 5,
        }}
      >
        <iframe
          src={mainIframeSrc}
          title="Sruvo - Care Match"
          className="absolute inset-0 w-full h-full border-none m-0 p-0 transition-opacity duration-300"
          style={{
            opacity: loading ? 0 : 1,
            pointerEvents: loading ? "none" : "auto",
            zIndex: loading ? 10 : 20,
          }}
        />
        <iframe
          src={loadingIframeSrc}
          title="Sruvo - Care Match Loading"
          className="absolute inset-0 w-full h-full border-none m-0 p-0 transition-opacity duration-300"
          style={{
            opacity: loading ? 1 : 0,
            pointerEvents: loading ? "auto" : "none",
            zIndex: loading ? 20 : 10,
          }}
        />
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RouteTracker />
              <GlobalSmartMatchIframe />
              <ErrorBoundary>
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/add-pet" element={<AddPet />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/addresses" element={<Addresses />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth/admin" element={<AuthAdmin />} />
                <Route path="/auth/breeder" element={<AuthBreeder />} />
                <Route path="/auth/buyer" element={<AuthBuyer />} />
                <Route path="/auth/delivery" element={<AuthDelivery />} />
                <Route path="/auth/products" element={<AuthProducts />} />
                <Route path="/auth/vet" element={<AuthVet />} />
                <Route path="/buyer/bookings" element={<Bookings />} />
                <Route path="/bookings" element={<Navigate to="/buyer/bookings" replace />} />
                <Route path="/profile/bookings" element={<Navigate to="/buyer/bookings" replace />} />
                <Route path="/brand/:brandName" element={<Navigate to="/buyer/shop/brand/:brandName" replace />} />
                <Route path="/buyer/shop/brand/:brandName" element={<BrandProfile />} />
                <Route path="/buyer-dashboard" element={<Navigate to="/buyer/home" replace />} />
                <Route path="/buyer/home" element={<BuyerDashboard />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/chats" element={<Chats />} />
                <Route path="/delivery" element={<DeliveryDashboard />} />
                <Route path="/edit-pet/:id" element={<EditPet />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/pet/:id" element={<Navigate to="/buyer/home/pet/:id" replace />} />
                <Route path="/pet-profile/:id" element={<Navigate to="/buyer/home/pet/:id" replace />} />
                <Route path="/buyer/home/pet/:id" element={<PetDetails />} />
                <Route path="/privacy" element={<PrivacySecurity />} />
                <Route path="/product-orders" element={<ProductOrders />} />
                <Route path="/product/:id" element={<Navigate to="/buyer/shop/product/:id" replace />} />
                <Route path="/buyer/shop/product/:id" element={<ProductProfile />} />
                <Route path="/products-dashboard" element={<ProductsDashboard />} />
                <Route path="/products-onboarding" element={<ProductsOnboarding />} />
                <Route path="/products-pending-approval" element={<ProductsPendingApproval />} />
                <Route path="/buyer/profile" element={<ProfileMenu />} />
                <Route path="/buyer/profile-menu" element={<ProfileMenu />} />
                <Route path="/buyer/profile-settings" element={<ProfileSettings />} />
                <Route path="/buyer/pet-passport" element={<EmptyPetPassport />} />
                <Route path="/passport/:id" element={<PublicPetPassport />} />
                <Route path="/seller-dashboard" element={<SellerDashboard />} />
                <Route path="/seller-onboarding" element={<SellerOnboarding />} />
                <Route path="/seller-pending-approval" element={<SellerPendingApproval />} />
                <Route path="/seller/:id" element={<Navigate to="/buyer/home/breeder/:id" replace />} />
                <Route path="/buyer/home/breeder/:id" element={<SellerProfile />} />
                <Route path="/shop" element={<Navigate to="/buyer/shop" replace />} />
                <Route path="/buyer/shop" element={<Shop />} />
                <Route path="/buyer/shop/:petShopType" element={<Shop />} />
                <Route path="/buyer/shop/:petShopType/catalog" element={<Shop />} />
                <Route path="/vet" element={<Navigate to="/buyer/vet" replace />} />
                <Route path="/buyer/vet" element={<Vet />} />
                <Route path="/vet/home" element={<VetHome />} />
                <Route path="/vet/schedule" element={<VetSchedule />} />
                <Route path="/vet/earnings" element={<VetEarnings />} />
                <Route path="/vet/profile" element={<VetProfile />} />
                <Route path="/vet/services" element={<MyServices />} />
                <Route path="/vet/profile-settings" element={<VetProfileSettings />} />
                <Route path="/vet/contact-details" element={<VetContactDetails />} />
                <Route path="/vet/wallet" element={<VetWallet />} />
                <Route path="/vet/documents" element={<VetDocuments />} />
                <Route path="/vet/promote-profile" element={<VetPromoteProfile />} />
                <Route path="/vet/recent-reviews" element={<VetRecentReviews />} />
                <Route path="/vet/virtual-consults" element={<VirtualConsults />} />
                <Route path="/vet/consultation-detail" element={<ConsultationDetail />} />
                <Route path="/buyer/vet/visit-details" element={<BuyerVisitDetails />} />
                <Route path="/buyer/vet/visit-details/:appointmentId" element={<BuyerVisitDetails />} />
                <Route path="/vet/schedule/visit-details" element={<VetScheduleVisitDetails />} />
                <Route path="/vet/schedule/visit-details/:appointmentId" element={<VetScheduleVisitDetails />} />
                <Route path="/buyer/vet/appointment/pending" element={<AppointmentConfirmation />} />
                <Route path="/buyer/vet/appointment/pending/:appointmentId" element={<AppointmentConfirmation />} />
                 <Route path="/vet-earnings" element={<Navigate to="/vet/earnings" replace />} />
                <Route path="/vet-schedule" element={<Navigate to="/vet/schedule" replace />} />
                <Route path="/vet/onboarding" element={
                  <VetProtectionWrapper requiredStatus="onboarding">
                    <VetOnboarding />
                  </VetProtectionWrapper>
                } />
                <Route path="/vet-onboarding" element={<Navigate to="/vet/onboarding" replace />} />
                <Route path="/vet/account-review" element={
                  <VetProtectionWrapper requiredStatus="pending">
                    <VetPendingApproval />
                  </VetProtectionWrapper>
                } />
                <Route path="/vet-pending-approval" element={<Navigate to="/vet/account-review" replace />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/wishlist" element={<Wishlist />} />

                {/* Care Plan Routes */}
                <Route path="/care-plan/form" element={<CarePlanForm />} />
                <Route path="/care-plan/form-step2" element={<Navigate to="/care-plan/step-2" replace />} />
                <Route path="/care-plan/step-2" element={<CarePlanFormStep2 />} />
                <Route path="/care-plan/intro" element={<CarePlanIntro />} />
                <Route path="/care-plan/report" element={<CarePlanReport />} />

                {/* Vet Assistant Routes */}
                <Route path="/vet/analyzing" element={<AIAnalyzingCondition />} />
                <Route path="/vet/ai-analyzing" element={<AIAnalyzingCondition />} />
                <Route path="/vet/assessment" element={<AIVetAssessment />} />
                <Route path="/vet/ai-assistant" element={<Navigate to="/buyer/care-match" replace />} />
                <Route path="/vet/booking-details" element={<BookingDetails />} />
                <Route path="/vet/connection-ready" element={<ConnectionReady />} />
                <Route path="/vet/consultation-plan" element={<ConsultationPlan />} />
                <Route path="/vet/consultation-summary" element={<ConsultationSummary />} />
                <Route path="/vet/consultation-confirmation" element={<ConsultationConfirmation />} />
                <Route path="/vet/clinic-booking-confirmation" element={<ClinicBookingConfirmation />} />
                <Route path="/vet/analysis-summary" element={<ConsultationAnalysisSummary />} />
                <Route path="/buyer/vet/prescription" element={<DigitalPrescription />} />
                <Route path="/vet/create-prescription" element={<CreatePrescription />} />
                <Route path="/vet/finding-vet" element={<FindingVet />} />
                <Route path="/vet/instant-analyzing" element={<InstantAnalyzing />} />
                <Route path="/vet/instant-assessment" element={<InstantAssessment />} />
                <Route path="/buyer/care-match" element={<CareMatchAssessment />} />
                <Route path="/vet/instant-video-call" element={<InstantVideoCall />} />
                <Route path="/vet/payment-failed" element={<PaymentFailed />} />
                <Route path="/vet/payment-summary" element={<PaymentSummary />} />
                <Route path="/buyer/vet/prescription/preparing" element={<PreparingPrescription />} />
                <Route path="/vet/doctor/:id" element={<VetDoctorProfile />} />
                <Route path="/vet/near-you" element={<VetsNearYou />} />
                <Route path="/vet/clinics-nearby" element={<ClinicsNearby />} />
                <Route path="/vet/all-specialists" element={<AllSpecializedVets />} />
                <Route path="/vet/clinic/:id" element={<ClinicDetails />} />
                <Route path="/vet/video-call" element={<VideoCall />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
              </ErrorBoundary>
            </BrowserRouter>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

