import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Catch global errors for debugging white screens
window.onerror = (message, source, lineno, colno, error) => {
  console.error("Global Error Caught:", { message, source, lineno, colno, error });
  const root = document.getElementById("root");
  if (root && root.innerHTML.trim() === "") {
    root.innerHTML = `<div style="padding: 20px; font-family: sans-serif; color: #dc2626;"><h1>App Load Error</h1><p>${message}</p></div>`;
  }
};

window.onunhandledrejection = (event) => {
  console.error("Unhandled Promise Rejection:", event.reason);
};

try {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("DOM element id 'root' not found");
  createRoot(rootElement).render(<App />);
} catch (err: any) {
  console.error("Critical Render Error:", err);
  const root = document.getElementById("root");
  if (root) root.innerHTML = `<div style="padding: 20px; color: red;"><h1>Init Fail</h1><p>${err?.message || String(err)}</p></div>`;
}
