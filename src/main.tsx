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
    // Suppress noise from Lovable/Vite dev server internal rejections
    if (event.reason?.message?.includes("supabase") || event.reason?.message?.includes("fetch")) {
      console.warn("Supabase Fetch Error caught globally. The database might be unreachable or tables might not exist yet.");
      event.preventDefault();
      
      const root = document.getElementById("root");
      if (root && !document.getElementById("connection-warning")) {
        const warning = document.createElement("div");
        warning.id = "connection-warning";
        warning.style.cssText = "position: fixed; top: 10px; left: 50%; transform: translateX(-50%); background: #fee2e2; border: 1px solid #ef4444; padding: 12px 24px; border-radius: 99px; z-index: 10000; font-size: 14px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); display: flex; align-items: center; gap: 8px;";
        warning.innerHTML = `<span>⚠️</span> <span style="font-weight: 600; color: #991b1b;">Connection Error:</span> <span style="color: #7f1d1d;">Could not reach the database. Please check your Supabase project status.</span> <button onclick="this.parentElement.remove()" style="margin-left: 10px; border: none; background: none; cursor: pointer; color: #991b1b; font-weight: bold;">✕</button>`;
        root.appendChild(warning);
      }
    }
    console.error("Unhandled Promise Rejection:", event.reason);
  };
})();

import { Buffer } from "buffer";
window.Buffer = Buffer;

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
