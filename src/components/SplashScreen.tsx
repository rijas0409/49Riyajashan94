import { SRUVO_LOGO_URL } from "@/constants/branding";

interface SplashScreenProps {
  message?: string;
}

const SplashScreen = ({ message }: SplashScreenProps) => {
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#ffffff', color: '#1e293b', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', zIndex: 9999 }}>
      <div className="logo-pulse" style={{ width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
        <img src={SRUVO_LOGO_URL} alt="Sruvo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      </div>
      <div style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', color: '#151B32', marginBottom: '8px' }}>Sruvo</div>
      <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1', animation: 'pulse-dot 1.5s infinite ease-in-out', animationDelay: '0s' }}></div>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1', animation: 'pulse-dot 1.5s infinite ease-in-out', animationDelay: '0.2s' }}></div>
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#cbd5e1', animation: 'pulse-dot 1.5s infinite ease-in-out', animationDelay: '0.4s' }}></div>
      </div>
      {message && <div style={{ marginTop: '16px', fontSize: '14px', color: '#64748b', fontStyle: 'italic' }}>{message}</div>}
      <style>{`
        @keyframes glow {
          0% { filter: drop-shadow(0 0 10px rgba(183, 132, 230, 0.4)); transform: scale(0.98); }
          50% { filter: drop-shadow(0 0 20px rgba(183, 132, 230, 0.7)); transform: scale(1.02); }
          100% { filter: drop-shadow(0 0 10px rgba(183, 132, 230, 0.4)); transform: scale(0.98); }
        }
        @keyframes pulse-dot {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 1; background-color: #B784E6; }
        }
        .logo-pulse { animation: glow 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default SplashScreen;
