import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// Intercept Ctrl+F / Cmd+F in capture phase to prevent WebView2 default browser find bar
window.addEventListener(
  "keydown",
  (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
      e.preventDefault();
      // Look for the in-app JSON search input
      const jsonSearchInput = document.querySelector(".json-search-input") as HTMLInputElement | null;
      if (jsonSearchInput) {
        jsonSearchInput.focus();
        jsonSearchInput.select();
      }
    }
  },
  { capture: true }
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
