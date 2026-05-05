import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Catch global errors for debugging white screens
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global Error Caught:", { message, source, lineno, colno, error });
  const root = document.getElementById("root");
  if (root) {
    const errorDiv = document.createElement("div");
    errorDiv.style.padding = "20px";
    errorDiv.style.color = "red";
    errorDiv.style.fontFamily = "sans-serif";
    errorDiv.style.background = "#fff";
    errorDiv.style.border = "2px solid red";
    errorDiv.style.margin = "20px";
    errorDiv.style.borderRadius = "8px";
    errorDiv.innerHTML = `<h1>App Load Error</h1><p>${message}</p><p><small>${source}:${lineno}:${colno}</small></p>`;
    root.prepend(errorDiv);
  }
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
};

console.log("App Initializing...");
console.log("Supabase URL present:", !!import.meta.env.VITE_SUPABASE_URL);
console.log("Supabase Key present:", !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("DOM element id 'root' not found");
  
  // Clear boot status if it exists
  const bootStatus = document.getElementById("boot-status");
  if (bootStatus) {
    // We don't remove it yet, we just hide it after a small delay
    // to give the app time to mount
    setTimeout(() => {
      if (bootStatus.parentNode) {
        bootStatus.style.display = "none";
      }
    }, 500);
  }

  createRoot(rootElement).render(<App />);
  console.log("App mounted");
} catch (err: any) {
  console.error("Critical Render Error:", err);
  const root = document.getElementById("root");
  if (root) root.innerHTML = `<div style="padding: 20px; color: red; font-family: sans-serif; background: white;"><h1>Init Fail</h1><p>${err?.message || String(err)}</p></div>`;
}
