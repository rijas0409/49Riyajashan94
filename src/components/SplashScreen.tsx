import { SRUVO_LOGO_URL } from "@/constants/branding";

interface SplashScreenProps {
  message?: string;
}

const SplashScreen = ({ message }: SplashScreenProps) => {
  return <div className="min-h-screen w-full bg-gray-50/30" />;
};

export default SplashScreen;
