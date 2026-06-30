import React from 'react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen = ({ message }: SplashScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
    </div>
  );
};

export default SplashScreen;
