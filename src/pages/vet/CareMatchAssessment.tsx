import { useEffect } from "react";

const CareMatchAssessment = () => {
  useEffect(() => {
    document.title = "Sruvo - Care Match";
    
    // Lock parent body scrolling to prevent double-scrollbars
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    
    document.body.style.overflow = "hidden";
    document.body.style.height = "100vh";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
    };
  }, []);

  return null;
};

export default CareMatchAssessment;
