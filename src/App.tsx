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
import NoVetFound from "./pages/vet/NoVetFound";

import VetSchedule from "./pages/vet/VetSchedule";
import VetEarnings from "./pages/vet/VetEarnings";
import VetProfile from "./pages/vet/VetProfile";
import VetProfileSettings from "./pages/vet/VetProfileSettings";
import VetSettings from "./pages/vet/VetSettings";
import VetWallet from "./pages/vet/VetWallet";
import VetDocuments from "./pages/vet/VetDocuments";
import VetPromoteProfile from "./pages/vet/VetPromoteProfile";
import VetRecentReviews from "./pages/vet/VetRecentReviews";
import VetSavingCorner from "./pages/vet/VetSavingCorner";
import MyServices from "./pages/vet/MyServices";
import Specializations from "./pages/vet/Specializations";
import VirtualConsults from "./pages/vet/VirtualConsults";
import VetProfessionalDetails from "./pages/vet/VetProfessionalDetails";
import VetAvailability from "./pages/vet/VetAvailability";

import React, { Component, ReactNode, useEffect, useState, useRef } from "react";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matchedVetResultRef = useRef<any>(null);

  const navigateRef = useRef(navigate);
  const userRef = useRef(user);
  const cityRef = useRef(city);
  const loadingRef = useRef(loading);
  const showAssessmentRef = useRef(showAssessment);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    cityRef.current = city;
  }, [city]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    showAssessmentRef.current = showAssessment;
  }, [showAssessment]);

  useEffect(() => {
    if (!isMatch) {
      setLoading(false);
      setShowAssessment(false);
    }
  }, [isMatch]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (!event.data) return;

      console.log("[Smart Match Listener] Received message event:", event.data.type, event.data);

      if (event.data.type === "SUBMIT_SMART_MATCH" || event.data.type === "SUBMIT_FORM") {
        setLoading(true);
        const payload = event.data.payload || {};
        console.log("[Smart Match Frontend] Complete questionnaire payload from Step 1-6 received:", payload);

        console.log("STEP 2 reached");
        fetch("/api/smart-match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        })
        .then(async (res) => {
          if (!res.ok) {
            throw new Error(`Server returned status ${res.status}`);
          }
          const data = await res.json();
          console.log("STEP 5 reached");
          console.log("Complete response JSON:", JSON.stringify(data));

          const candidates = Array.isArray(data.candidates) ? data.candidates : [];
          const scoredCandidates = Array.isArray(data.scoredCandidates) ? data.scoredCandidates : [];

          // Implement Phase 4 Winner Selection Logic
          let bestScored: any = null;

          for (const cand of scoredCandidates) {
            if (!cand || !cand.id) continue;
            const rawVet = candidates.find((v: any) => (v.id === cand.id || v.user_id === cand.id));
            if (!rawVet) continue;

            if (!bestScored) {
              bestScored = { cand, rawVet };
              continue;
            }

            // Compare with current bestScored
            // Rule 1: Highest totalScore
            if (cand.totalScore > bestScored.cand.totalScore) {
              bestScored = { cand, rawVet };
            } else if (cand.totalScore === bestScored.cand.totalScore) {
              // Rule 2: If same totalScore, apply tie-breakers sequentially:
              
              // 2.1 Higher years of experience
              const expA = typeof rawVet.years_of_experience === "number" ? rawVet.years_of_experience : 0;
              const expB = typeof bestScored.rawVet.years_of_experience === "number" ? bestScored.rawVet.years_of_experience : 0;
              
              if (expA > expB) {
                console.log(`[Smart Match Tie-Break] Same totalScore ${cand.totalScore}. Breaking tie: Vet ${cand.id} has higher experience (${expA} years) than Vet ${bestScored.cand.id} (${expB} years).`);
                bestScored = { cand, rawVet };
              } else if (expA === expB) {
                // 2.2 Lower consultation fee
                const feeA = typeof rawVet.online_fee === "number" ? rawVet.online_fee : (typeof rawVet.offline_fee === "number" ? rawVet.offline_fee : 500);
                const feeB = typeof bestScored.rawVet.online_fee === "number" ? bestScored.rawVet.online_fee : (typeof bestScored.rawVet.offline_fee === "number" ? bestScored.rawVet.offline_fee : 500);

                if (feeA < feeB) {
                  console.log(`[Smart Match Tie-Break] Same experience ${expA} years. Breaking tie: Vet ${cand.id} has lower fee (${feeA}) than Vet ${bestScored.cand.id} (${feeB}).`);
                  bestScored = { cand, rawVet };
                } else if (feeA === feeB) {
                  // 2.3 Higher rating
                  const ratingA = typeof rawVet.average_rating === "number" ? rawVet.average_rating : 0;
                  const ratingB = typeof bestScored.rawVet.average_rating === "number" ? bestScored.rawVet.average_rating : 0;

                  if (ratingA > ratingB) {
                    console.log(`[Smart Match Tie-Break] Same fee ${feeA}. Breaking tie: Vet ${cand.id} has higher rating (${ratingA}) than Vet ${bestScored.cand.id} (${ratingB}).`);
                    bestScored = { cand, rawVet };
                  } else if (ratingA === ratingB) {
                    // 2.4 Closer distance (higher distanceScore since score is normalized lower-is-better)
                    const distScoreA = typeof cand.distanceScore === "number" ? cand.distanceScore : 0;
                    const distScoreB = typeof bestScored.cand.distanceScore === "number" ? bestScored.cand.distanceScore : 0;
                    
                    if (distScoreA > distScoreB) {
                      console.log(`[Smart Match Tie-Break] Same rating ${ratingA}. Breaking tie: Vet ${cand.id} is closer (distanceScore ${distScoreA}) than Vet ${bestScored.cand.id} (distanceScore ${distScoreB}).`);
                      bestScored = { cand, rawVet };
                    }
                  }
                }
              }
            }
          }

          // Print detailed logs as required
          console.log("-----------------------------------------");
          console.log("SMART MATCH FRONTEND WINNER SELECTION LOGS");
          console.log("-----------------------------------------");
          console.log(`total scored candidates: ${scoredCandidates.length}`);
          scoredCandidates.forEach((cand: any) => {
            const rawVet = candidates.find((v: any) => (v.id === cand.id || v.user_id === cand.id));
            const exp = rawVet ? rawVet.years_of_experience : "unknown";
            const fee = rawVet ? (rawVet.online_fee || rawVet.offline_fee || 500) : "unknown";
            const rating = rawVet ? rawVet.average_rating : "unknown";
            console.log(`Candidate ID: ${cand.id} | Total Score: ${cand.totalScore} | Experience: ${exp} years | Fee: ${fee} | Rating: ${rating}`);
          });

          if (bestScored) {
            console.log(`selected vet ID: ${bestScored.rawVet.id}`);
            console.log(`final navigation decision: Navigate to Booking Details (/vet/booking-details)`);

            // Fetch corresponding profile name & photo from supabase to build matchedVetResultRef
            try {
              const { data: prof } = await supabase
                .from("profiles")
                .select("name, full_name, profile_photo")
                .eq("id", bestScored.rawVet.user_id)
                .maybeSingle();

              const rawName = prof?.full_name || prof?.name || (bestScored.rawVet.user_id === "f9834ef6-778d-4384-8d17-6316fffa03b6" ? "Jashan Pabla" : "Veterinarian");
              const realName = `Dr. ${rawName}`;

              matchedVetResultRef.current = {
                id: bestScored.rawVet.id,
                userId: bestScored.rawVet.user_id,
                name: realName,
                specialization: bestScored.rawVet.specializations?.[0] || "General Veterinarian",
                image: prof?.profile_photo || bestScored.rawVet.profile_photo || "",
                rating: bestScored.rawVet.average_rating || 0,
                experience: bestScored.rawVet.years_of_experience || 0,
                fee: bestScored.rawVet.online_fee || 499,
                onlineFee: bestScored.rawVet.online_fee || 500,
                offlineFee: bestScored.rawVet.offline_fee || 800,
                weekly_availability: bestScored.rawVet.weekly_availability,
              };
            } catch (err) {
              console.error("[Smart Match Frontend] Error fetching winner profile details:", err);
              // Fallback
              matchedVetResultRef.current = {
                id: bestScored.rawVet.id,
                userId: bestScored.rawVet.user_id,
                name: `Dr. Veterinarian`,
                specialization: bestScored.rawVet.specializations?.[0] || "General Veterinarian",
                image: bestScored.rawVet.profile_photo || "",
                rating: bestScored.rawVet.average_rating || 0,
                experience: bestScored.rawVet.years_of_experience || 0,
                fee: bestScored.rawVet.online_fee || 499,
                onlineFee: bestScored.rawVet.online_fee || 500,
                offlineFee: bestScored.rawVet.offline_fee || 800,
                weekly_availability: bestScored.rawVet.weekly_availability,
              };
            }
          } else {
            console.log(`final navigation decision: Navigate to No Vet Found (/vet/no-vet-found)`);
            if (scoredCandidates.length === 0) {
              console.log(`exact reason if no winner is selected: No scoredCandidates returned from the backend (scoredCandidates is empty)`);
            } else {
              console.log(`exact reason if no winner is selected: scoredCandidates returned from the backend but all values are invalid (no matching candidates)`);
            }
            matchedVetResultRef.current = null;
          }
          console.log("-----------------------------------------");

          const iframe = document.querySelector('iframe[title="Sruvo - Care Match Loading"]') as HTMLIFrameElement;
          console.log("STEP 6 reached");
          console.log("- iframe reference:", iframe);
          console.log("- iframe exists?:", !!iframe);
          console.log("- iframe.contentWindow exists?:", iframe ? !!iframe.contentWindow : false);

          if (iframe && iframe.contentWindow) {
            // Count of valid candidates/winner selected
            const count = matchedVetResultRef.current ? 1 : 0;

            if (count > 0) {
              console.log("[Smart Match Frontend] Posting MATCH_FOUND to loading iframe");
              iframe.contentWindow.postMessage({ type: "MATCH_FOUND" }, "*");
            } else {
              console.log("[Smart Match Frontend] Posting NO_VET_FOUND to loading iframe");
              iframe.contentWindow.postMessage({ type: "NO_VET_FOUND" }, "*");
            }
            console.log("STEP 7 reached");
          } else {
            console.warn("[Smart Match Frontend] Loading iframe not found to send match status message!");
          }
        })
        .catch((err) => {
          console.error("[Smart Match Frontend] Error calling POST /api/smart-match:", err);
          const iframe = document.querySelector('iframe[title="Sruvo - Care Match Loading"]') as HTMLIFrameElement;
          if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: "NO_VET_FOUND" }, "*");
          }
        });
      } else if (event.data.type === "NAVIGATE_PARENT") {
        if (event.data.path === "/vet/ai-assistant") {
          setShowAssessment(false);
          return;
        }
        navigateRef.current(event.data.path);
      } else if (event.data.type === "MATCH_FOUND") {
        console.log("[Smart Match Frontend] Explicit MATCH_FOUND message received from client");
        const iframe = document.querySelector('iframe[title="Sruvo - Care Match Loading"]') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "MATCH_FOUND" }, "*");
        }
      } else if (event.data.type === "NO_VET_FOUND") {
        console.log("[Smart Match Frontend] Explicit NO_VET_FOUND message received from client");
        matchedVetResultRef.current = null;
        const iframe = document.querySelector('iframe[title="Sruvo - Care Match Loading"]') as HTMLIFrameElement;
        if (iframe && iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "NO_VET_FOUND" }, "*");
        }
      } else if (event.data.type === "MATCH_COMPLETE") {
        console.log("STEP 11 reached");
        console.log("STEP 12 reached");
        setLoading(false);
        setShowAssessment(false);
        if (matchedVetResultRef.current) {
          navigateRef.current("/vet/booking-details", { state: { matchedVet: matchedVetResultRef.current } });
        } else {
          navigateRef.current("/vet/no-vet-found");
        }
      } else if (event.data.type === "CANCEL_LOADING") {
        setLoading(false);
      } else if (event.data.type === "CLOSE_LOADING") {
        setLoading(false);
        setShowAssessment(false);
        navigateRef.current("/vet/no-vet-found");
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

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
      className={`fixed inset-0 w-full h-full overflow-hidden bg-white z-[9999] transition-opacity duration-200 ${
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
                <Route path="/vet/specializations" element={<Specializations />} />
                <Route path="/vet/professional-details" element={<VetProfessionalDetails />} />
                <Route path="/vet/availability" element={<VetAvailability />} />
                <Route path="/vet/settings" element={<VetSettings />} />
                <Route path="/vet/profile-settings" element={<VetProfileSettings />} />
                <Route path="/vet/wallet" element={<VetWallet />} />
                <Route path="/vet/documents" element={<VetDocuments />} />
                <Route path="/vet/promote-profile" element={<VetPromoteProfile />} />
                <Route path="/vet/saving-corner" element={<VetSavingCorner />} />
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
                <Route path="/vet/no-vet-found" element={<NoVetFound />} />
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

