import React, { useEffect, useState } from "react";
import "./App.css";
import Dashboard from "./Dashboard";

/**
 * Loads environment variables.
 * This is future-proofing, for instance loading a baseURL, currently unused.
 * In real deployment, would use process.env, VITE_, REACT_APP_ etc, and .env config.
 */
function useEnvVar(name, fallback) {
  // eslint-disable-next-line no-undef
  const val = typeof process !== "undefined" && process.env && process.env[name];
  return val || fallback;
}

// PUBLIC_INTERFACE
function App() {
  const [theme, setTheme] = useState("light");

  // Apply theme (light only, but allow toggle for modern feel and optionality)
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Example: load an env var for future API endpoints (not currently used)
  // const apiBase = useEnvVar("REACT_APP_API_BASE_URL", "http://localhost:5000/api");

  return (
    <div className="App" style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* Optional: Theme toggle */}
      <button
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      >
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      <Dashboard />
    </div>
  );
}

export default App;
