import React from 'react';

interface SplashScreenProps {
  message?: string;
}

const SplashScreen = ({ message }: SplashScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );
};

export default SplashScreen;
