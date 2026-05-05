// CRITICAL: Initialize global error handlers first thing, before any other imports
// because static imports might fail and cause a white screen.
(function() {
  console.log("Entry point reached. Setting up error handlers...");

  window.onerror = (message, source, lineno, colno, error) => {
    console.error("Global Error Caught:", { message, source, lineno, colno, error });
    const root = document.getElementById("root");
    if (root) {
      const errorDiv = document.createElement("div");
      errorDiv.style.cssText = "padding: 20px; color: red; font-family: sans-serif; background: #fff; border: 5px solid red; position: fixed; top: 0; left: 0; right: 0; z-index: 9999;";
      errorDiv.innerHTML = `
        <h1>🚨 Application Load Error</h1>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Source:</strong> ${source}:${lineno}:${colno}</p>
        <hr/>
        <p>Please check your browser console for more details.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: red; color: white; border: none; border-radius: 4px; cursor: pointer;">Reload Application</button>
      `;
      root.prepend(errorDiv);
    }
  };

  window.onunhandledrejection = (event) => {
    console.error("Unhandled Promise Rejection:", event.reason);
  };
})();

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("App Initializing...");
console.log("Supabase URL present:", !!import.meta.env.VITE_SUPABASE_URL);

// Use a self-executing function to catch mount errors
(function mountApp() {
  try {
    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("DOM element id 'root' not found");
    
    // Clear boot status if it exists
    const bootStatus = document.getElementById("boot-status");
    if (bootStatus) {
      bootStatus.style.display = "none";
    }

    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("App mount signal successfully sent to React");
  } catch (err: any) {
    console.error("Critical Render Error:", err);
    const root = document.getElementById("root");
    if (root) {
      root.innerHTML = `
        <div style="padding: 20px; color: red; font-family: sans-serif; background: white; border: 2px solid red;">
          <h1>Init Fail</h1>
          <p>${err?.message || String(err)}</p>
          <pre style="white-space: pre-wrap; font-size: 12px; margin-top: 10px;">${err?.stack || ""}</pre>
        </div>
      `;
    }
  }
})();
