import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LocationProvider } from "./contexts/LocationContext";
import { CartProvider } from "./contexts/CartContext";

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
import DigitalPrescription from "./pages/vet/DigitalPrescription";
import FindingVet from "./pages/vet/FindingVet";
import InstantAnalyzing from "./pages/vet/InstantAnalyzing";
import InstantAssessment from "./pages/vet/InstantAssessment";
import InstantVideoCall from "./pages/vet/InstantVideoCall";
import PaymentFailed from "./pages/vet/PaymentFailed";
import PaymentSummary from "./pages/vet/PaymentSummary";
import PreparingPrescription from "./pages/vet/PreparingPrescription";
import VetDoctorProfile from "./pages/vet/VetDoctorProfile";
import VetsNearYou from "./pages/vet/VetsNearYou";
import ClinicsNearby from "./pages/vet/ClinicsNearby";
import AllSpecializedVets from "./pages/vet/AllSpecializedVets";
import ConsultationDetail from "./pages/vet/ConsultationDetail";
import ConsultationAnalysisSummary from "./pages/vet/ConsultationAnalysisSummary";
import HomeVisitDetails from "./pages/vet/HomeVisitDetails";
import ClinicVisitDetails from "./pages/vet/ClinicVisitDetails";
import VideoCall from "./pages/vet/VideoCall";

import { AdminUserApprover } from "./components/AdminUserApprover";
import VetSchedule from "./pages/vet/VetSchedule";
import VetEarnings from "./pages/vet/VetEarnings";
import VetProfile from "./pages/vet/VetProfile";
import VideoConsultation from "./pages/vet/VideoConsultation";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <AdminUserApprover />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/add-pet" element={<AddPet />} />
                <Route path="/add-product" element={<AddProduct />} />
                <Route path="/addresses" element={<Addresses />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/auth-admin" element={<AuthAdmin />} />
                <Route path="/auth-breeder" element={<AuthBreeder />} />
                <Route path="/auth-buyer" element={<AuthBuyer />} />
                <Route path="/auth-delivery" element={<AuthDelivery />} />
                <Route path="/auth-products" element={<AuthProducts />} />
                <Route path="/auth-vet" element={<AuthVet />} />
                <Route path="/bookings" element={<Bookings />} />
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
                <Route path="/profile" element={<ProfileMenu />} />
                <Route path="/profile-menu" element={<ProfileMenu />} />
                <Route path="/profile-settings" element={<ProfileSettings />} />
                <Route path="/seller-dashboard" element={<SellerDashboard />} />
                <Route path="/seller-onboarding" element={<SellerOnboarding />} />
                <Route path="/seller-pending-approval" element={<SellerPendingApproval />} />
                <Route path="/seller/:id" element={<Navigate to="/buyer/home/breeder/:id" replace />} />
                <Route path="/buyer/home/breeder/:id" element={<SellerProfile />} />
                <Route path="/shop" element={<Navigate to="/buyer/shop" replace />} />
                <Route path="/buyer/shop" element={<Shop />} />
                <Route path="/buyer/shop/:petShopType" element={<Shop />} />
                <Route path="/buyer/shop/:petShopType/catalog" element={<Shop />} />
                <Route path="/vet" element={<Vet />} />
                <Route path="/vet/home" element={<VetHome />} />
                <Route path="/vet/schedule" element={<VetSchedule />} />
                <Route path="/vet/earnings" element={<VetEarnings />} />
                <Route path="/vet/profile" element={<VetProfile />} />
                <Route path="/vet/video-consultation" element={<VideoConsultation />} />
                <Route path="/vet/consultation-detail" element={<ConsultationDetail />} />
                <Route path="/vet/home-visit-details" element={<HomeVisitDetails />} />
                <Route path="/vet/clinic-visit-details" element={<ClinicVisitDetails />} />
                <Route path="/vet-earnings" element={<Navigate to="/vet/earnings" replace />} />
                <Route path="/vet-schedule" element={<Navigate to="/vet/schedule" replace />} />
                <Route path="/vet-onboarding" element={<VetOnboarding />} />
                <Route path="/vet-pending-approval" element={<VetPendingApproval />} />
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
                <Route path="/vet/ai-assistant" element={<AIVetAssistant />} />
                <Route path="/vet/booking-details" element={<BookingDetails />} />
                <Route path="/vet/connection-ready" element={<ConnectionReady />} />
                <Route path="/vet/consultation-plan" element={<ConsultationPlan />} />
                <Route path="/vet/consultation-summary" element={<ConsultationSummary />} />
                <Route path="/vet/consultation-confirmation" element={<ConsultationConfirmation />} />
                <Route path="/vet/analysis-summary" element={<ConsultationAnalysisSummary />} />
                <Route path="/vet/digital-prescription" element={<DigitalPrescription />} />
                <Route path="/vet/prescription" element={<DigitalPrescription />} />
                <Route path="/vet/finding-vet" element={<FindingVet />} />
                <Route path="/vet/instant-analyzing" element={<InstantAnalyzing />} />
                <Route path="/vet/instant-assessment" element={<InstantAssessment />} />
                <Route path="/vet/instant-video-call" element={<InstantVideoCall />} />
                <Route path="/vet/payment-failed" element={<PaymentFailed />} />
                <Route path="/vet/payment-summary" element={<PaymentSummary />} />
                <Route path="/vet/preparing-prescription" element={<PreparingPrescription />} />
                <Route path="/vet/doctor/:id" element={<VetDoctorProfile />} />
                <Route path="/vet/near-you" element={<VetsNearYou />} />
                <Route path="/vet/clinics-nearby" element={<ClinicsNearby />} />
                <Route path="/vet/all-specialists" element={<AllSpecializedVets />} />
                <Route path="/vet/video-call" element={<VideoCall />} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

